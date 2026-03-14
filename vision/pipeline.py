"""
Vision module — Face Recognition Pipeline

Core functions:
1. generate_embedding(image_path) -> list[float]
2. match_embedding(cctv_embedding, threshold) -> list[MatchResult]
3. process_cctv_frame(frame_bytes, camera_id) -> None
"""
import logging
from collections import namedtuple
from typing import List, Optional

import cv2
import face_recognition
import numpy as np
from django.conf import settings
from django.core.files.base import ContentFile

from .utils import (
    validate_image_file,
    bytes_to_numpy,
    numpy_to_rgb,
    NoFaceDetectedException,
)

logger = logging.getLogger(__name__)

MatchResult = namedtuple('MatchResult', ['missing_person_image_id', 'missing_person_id', 'distance', 'confidence'])


def generate_embedding(image_path: str) -> List[float]:
    """
    Load an image, detect a face, and generate a 128-d embedding.

    Args:
        image_path: Absolute path to the image file.

    Returns:
        128-dimensional face embedding as a list of floats.

    Raises:
        NoFaceDetectedException: If no face is found in the image.
    """
    validate_image_file(image_path)

    # Load image (face_recognition expects RGB)
    image = face_recognition.load_image_file(image_path)

    # Detect face locations
    face_locations = face_recognition.face_locations(image, model='hog')
    if not face_locations:
        raise NoFaceDetectedException(f'No face detected in: {image_path}')

    # Generate embedding for the first (largest) face
    encodings = face_recognition.face_encodings(image, known_face_locations=[face_locations[0]])
    if not encodings:
        raise NoFaceDetectedException(f'Could not encode face in: {image_path}')

    return encodings[0].tolist()


def match_embedding(
    cctv_embedding: List[float],
    threshold: Optional[float] = None,
) -> List[MatchResult]:
    """
    Compare a CCTV-generated embedding against all ACTIVE missing person embeddings.

    Excludes:
    - Cases with status != ACTIVE (FOUND, CLOSED)
    - Cases that already have a VERIFIED detection alert (confirmed match)

    Args:
        cctv_embedding: 128-d embedding from a CCTV frame face.
        threshold: Maximum Euclidean distance for a match (lower = stricter).

    Returns:
        List of MatchResult sorted by confidence (highest first).
    """
    from cases.models import MissingPersonImage
    from alerts.models import DetectionAlert

    if threshold is None:
        threshold = getattr(settings, 'FACE_MATCH_THRESHOLD', 0.5)

    cctv_vec = np.array(cctv_embedding)

    # Get case IDs that already have a VERIFIED alert — skip those
    verified_case_ids = set(
        DetectionAlert.objects
        .filter(status='VERIFIED')
        .values_list('missing_person_id', flat=True)
        .distinct()
    )

    # Fetch all embeddings for ACTIVE cases only
    images = list(
        MissingPersonImage.objects
        .filter(
            face_embedding__isnull=False,
            case__status='ACTIVE',
        )
        .select_related('case')
        .values_list('id', 'case_id', 'face_embedding')
    )

    logger.info(
        '🔍 Matching against %d stored embedding(s), %d verified exclusion(s), threshold=%.2f',
        len(images), len(verified_case_ids), threshold,
    )

    matches = []
    for img_id, case_id, embedding_json in images:
        # Skip if this case already has a verified alert
        if case_id in verified_case_ids:
            logger.debug('  Skipping case %d (already VERIFIED)', case_id)
            continue

        stored_vec = np.array(embedding_json)
        distance = float(np.linalg.norm(cctv_vec - stored_vec))

        # Log ALL distances for debugging
        logger.info(
            '  📏 Case #%d, Image #%d — distance: %.4f (threshold: %.2f) — %s',
            case_id, img_id, distance, threshold,
            '✅ MATCH' if distance <= threshold else '❌ no match',
        )

        if distance <= threshold:
            confidence = max(0.0, 1.0 - distance)
            matches.append(MatchResult(
                missing_person_image_id=img_id,
                missing_person_id=case_id,
                distance=round(distance, 4),
                confidence=round(confidence, 4),
            ))

    # Sort by confidence descending
    matches.sort(key=lambda m: m.confidence, reverse=True)
    return matches


def process_cctv_frame(frame_bytes: bytes, camera_id: int) -> None:
    """
    Process a single CCTV frame:
    1. Detect all faces in the frame.
    2. Generate embeddings for each face.
    3. Match against stored missing person embeddings.
    4. On match: save snapshot + create DetectionAlert.

    Args:
        frame_bytes: Raw frame as bytes or numpy-compatible buffer.
        camera_id: ID of the CCTVCamera that produced this frame.
    """
    from alerts.models import DetectionAlert

    # Decode frame
    bgr_image = bytes_to_numpy(frame_bytes)
    rgb_image = numpy_to_rgb(bgr_image)

    # Detect faces
    face_locations = face_recognition.face_locations(rgb_image, model='hog')
    if not face_locations:
        return

    # Generate embeddings for all detected faces
    encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)

    for encoding in encodings:
        embedding = encoding.tolist()
        matches = match_embedding(embedding)

        for match in matches:
            # Save snapshot as JPEG
            _, buffer = cv2.imencode('.jpg', bgr_image)
            snapshot_file = ContentFile(
                buffer.tobytes(),
                name=f'alert_camera_{camera_id}_{match.missing_person_id}.jpg',
            )

            # Create alert
            alert = DetectionAlert.objects.create(
                missing_person_id=match.missing_person_id,
                camera_id=camera_id,
                snapshot=snapshot_file,
                confidence_score=match.confidence,
            )

            logger.info(
                'Detection alert #%d created — Person ID %d, Camera %d, Confidence %.2f',
                alert.id, match.missing_person_id, camera_id, match.confidence,
            )

            # Trigger officer notification asynchronously
            from vision.tasks import notify_nearby_officers
            notify_nearby_officers.delay(alert.id)
