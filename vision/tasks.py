"""
Vision module — Celery Tasks

Tasks:
- generate_embedding_for_case_image(image_id)
- match_captured_frames_batch(frame_paths, camera_id) — batch processes captured frames
- notify_nearby_officers(alert_id)
"""
import os
import logging

import cv2
import numpy as np
import requests
from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def generate_embedding_for_case_image(self, image_id: int):
    """
    Generate and store a face embedding for a MissingPersonImage.
    Called after MissingPersonImage save via Django signal.
    """
    from cases.models import MissingPersonImage
    from vision.pipeline import generate_embedding
    from vision.utils import NoFaceDetectedException

    try:
        image_obj = MissingPersonImage.objects.get(id=image_id)
    except MissingPersonImage.DoesNotExist:
        logger.error('MissingPersonImage #%d not found.', image_id)
        return

    try:
        embedding = generate_embedding(image_obj.image.path)
        image_obj.face_embedding = embedding
        image_obj.save(update_fields=['face_embedding'])
        logger.info('✅ Embedding generated for MissingPersonImage #%d (128-d vector).', image_id)
    except NoFaceDetectedException:
        logger.warning('⚠️ No face detected in MissingPersonImage #%d.', image_id)
    except Exception as exc:
        logger.error('Error generating embedding for image #%d: %s', image_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1, default_retry_delay=10)
def match_captured_frames_batch(self, frame_paths: list, camera_id: int):
    """
    Batch process multiple captured face frames.

    1. Load all saved frames from disk
    2. For each frame: detect faces, generate embeddings, match
    3. Pick the best match across all frames (highest confidence)
    4. Create DetectionAlert if match found
    5. Clean up all frame files

    Batch processing is more efficient and picks the best frame.
    """
    import face_recognition
    from alerts.models import DetectionAlert
    from cameras.models import CCTVCamera
    from vision.pipeline import match_embedding

    logger.info('📦 Processing batch of %d frame(s) for camera %d', len(frame_paths), camera_id)

    # Get camera info
    camera = None
    try:
        camera = CCTVCamera.objects.get(id=camera_id)
    except CCTVCamera.DoesNotExist:
        pass  # camera_id=0 (webcam) won't exist in DB

    camera_name = camera.name if camera else f'Webcam (ID: {camera_id})'
    camera_location = camera.location_name if camera else 'Local Device'

    # Collect all matches across all frames
    # Structure: { person_id: { 'best_confidence': float, 'best_frame': ndarray, 'match': MatchResult } }
    best_matches = {}

    valid_paths = [p for p in frame_paths if os.path.exists(p)]
    logger.info('  Valid frames: %d / %d', len(valid_paths), len(frame_paths))

    for frame_path in valid_paths:
        try:
            bgr_image = cv2.imread(frame_path)
            if bgr_image is None:
                continue

            rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

            # Detect faces with face_recognition (more accurate than Haar)
            face_locations = face_recognition.face_locations(rgb_image, model='hog')
            if not face_locations:
                logger.debug('  No faces (face_recognition) in %s', os.path.basename(frame_path))
                continue

            logger.info('  Found %d face(s) in %s', len(face_locations), os.path.basename(frame_path))

            # Generate embeddings
            encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)

            for encoding in encodings:
                embedding = encoding.tolist()
                matches = match_embedding(embedding)

                for match_result in matches:
                    pid = match_result.missing_person_id
                    if pid not in best_matches or match_result.confidence > best_matches[pid]['best_confidence']:
                        best_matches[pid] = {
                            'best_confidence': match_result.confidence,
                            'best_frame': bgr_image,
                            'match': match_result,
                        }

        except Exception as e:
            logger.error('  Error processing %s: %s', os.path.basename(frame_path), e)

    # Create alerts for best matches
    alerts_created = 0

    for pid, data in best_matches.items():
        match_result = data['match']
        best_frame = data['best_frame']

        # Dedup — check for recent alert for same person (within 60s)
        from django.utils import timezone
        from datetime import timedelta
        recent = DetectionAlert.objects.filter(
            missing_person_id=pid,
            detected_at__gte=timezone.now() - timedelta(seconds=60),
        ).exists()

        if recent:
            logger.debug('  Skipping duplicate alert for person %d (within 60s)', pid)
            continue

        # Save best frame as snapshot
        _, buffer = cv2.imencode('.jpg', best_frame)
        snapshot_file = ContentFile(
            buffer.tobytes(),
            name=f'alert_cam{camera_id}_person{pid}.jpg',
        )

        alert = DetectionAlert.objects.create(
            missing_person_id=pid,
            camera=camera,
            snapshot=snapshot_file,
            confidence_score=match_result.confidence,
        )

        alerts_created += 1
        logger.info(
            '🚨 Alert #%d — Person #%d on %s (%s) — Confidence: %.1f%% — Distance: %.4f',
            alert.id, pid, camera_name, camera_location,
            match_result.confidence * 100, match_result.distance,
        )

        # Push notification
        notify_nearby_officers.delay(alert.id)

    if alerts_created:
        logger.info('📦 Batch complete: %d alert(s) created', alerts_created)
    else:
        logger.info('📦 Batch complete: no matches found in %d frame(s)', len(valid_paths))

    # Clean up all frame files
    for frame_path in frame_paths:
        try:
            os.remove(frame_path)
        except OSError:
            pass


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def notify_nearby_officers(self, alert_id: int):
    """
    After a DetectionAlert is created:
    1. Find all police officers.
    2. Create Notification records.
    3. POST to Node.js for real-time push (includes camera + location).
    """
    from alerts.models import DetectionAlert, Notification
    from accounts.models import User

    try:
        alert = (
            DetectionAlert.objects
            .select_related('missing_person', 'camera')
            .get(id=alert_id)
        )
    except DetectionAlert.DoesNotExist:
        logger.error('DetectionAlert #%d not found.', alert_id)
        return

    # Notify all police officers
    officers = list(User.objects.filter(role='POLICE'))

    notifications = [Notification(alert=alert, officer=o) for o in officers]
    Notification.objects.bulk_create(notifications)

    logger.info('Created %d notifications for Alert #%d.', len(notifications), alert_id)

    # Push to Node.js
    node_url = getattr(settings, 'NODE_SERVICE_URL', None)
    if node_url:
        camera_name = alert.camera.name if alert.camera else 'Webcam'
        camera_location = alert.camera.location_name if alert.camera else 'Local Device'
        try:
            payload = {
                'alert_id': alert.id,
                'missing_person_name': alert.missing_person.name,
                'camera_name': camera_name,
                'camera_location': camera_location,
                'confidence_score': alert.confidence_score,
                'officer_ids': [o.id for o in officers],
                'snapshot_url': alert.snapshot.url if alert.snapshot else None,
            }
            requests.post(f'{node_url}/api/alerts/push', json=payload, timeout=5)
            logger.info('Alert #%d pushed to Node.js', alert_id)
        except requests.RequestException as exc:
            logger.error('Failed to push alert to Node service: %s', exc)
