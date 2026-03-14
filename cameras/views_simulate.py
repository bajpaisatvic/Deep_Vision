"""
Cameras app — Simulation API View

POST /api/cameras/simulate/ — Trigger a one-shot detection cycle
using an uploaded test image or the local webcam. Creates real
DetectionAlert records for demonstration purposes.
"""
import logging
import cv2
import numpy as np
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsPoliceOrAdmin

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPoliceOrAdmin])
def simulate_detection(request):
    """
    Simulate a detection cycle.

    Accepts either:
    - An uploaded image (`image` field in multipart form)
    - Or captures a frame from the local webcam

    Runs face detection + matching against stored missing person
    embeddings, creates real DetectionAlert records, and pushes
    notifications to the Node.js real-time server.
    """
    import face_recognition
    from cases.models import MissingPersonImage
    from alerts.models import DetectionAlert, Notification
    from geo.utils import get_officers_within_radius
    from cameras.models import CCTVCamera

    # Get the image
    if 'image' in request.FILES:
        # Use uploaded image
        file = request.FILES['image']
        image_bytes = file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    else:
        # Capture from webcam
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return Response({'error': 'Cannot access webcam.'}, status=400)
        ret, bgr_image = cap.read()
        cap.release()
        if not ret:
            return Response({'error': 'Failed to capture webcam frame.'}, status=400)

    # Convert to RGB for face_recognition
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

    # Detect faces
    face_locations = face_recognition.face_locations(rgb_image, model='hog')
    if not face_locations:
        return Response({
            'status': 'no_faces',
            'message': 'No faces detected in the frame.',
            'faces_found': 0,
        })

    # Generate embeddings
    encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)

    # Fetch all stored embeddings for active cases
    stored_images = list(
        MissingPersonImage.objects
        .filter(face_embedding__isnull=False, case__status='ACTIVE')
        .select_related('case')
        .values_list('id', 'case_id', 'case__name', 'face_embedding')
    )

    if not stored_images:
        return Response({
            'status': 'no_embeddings',
            'message': f'Found {len(face_locations)} face(s) but no missing person embeddings stored.',
            'faces_found': len(face_locations),
        })

    threshold = getattr(settings, 'FACE_MATCH_THRESHOLD', 0.5)
    camera = CCTVCamera.objects.filter(is_active=True).first()

    alerts_created = []

    for encoding in encodings:
        cctv_vec = np.array(encoding)

        for img_id, case_id, case_name, embedding_json in stored_images:
            stored_vec = np.array(embedding_json)
            distance = float(np.linalg.norm(cctv_vec - stored_vec))

            if distance <= threshold:
                confidence = max(0.0, 1.0 - distance)

                # Save snapshot
                _, buffer = cv2.imencode('.jpg', bgr_image)
                snapshot = ContentFile(
                    buffer.tobytes(),
                    name=f'sim_alert_case_{case_id}.jpg',
                )

                # Create alert
                alert = DetectionAlert.objects.create(
                    missing_person_id=case_id,
                    camera=camera,
                    snapshot=snapshot,
                    confidence_score=round(confidence, 4),
                )

                alerts_created.append({
                    'alert_id': alert.id,
                    'missing_person_name': case_name,
                    'confidence': round(confidence, 4),
                    'distance': round(distance, 4),
                })

                # Notify officers
                if camera:
                    radius = getattr(settings, 'GEOFENCE_RADIUS_METERS', 100)
                    officers = get_officers_within_radius(
                        camera.latitude, camera.longitude, radius * 100,  # wider radius for demo
                    )
                    for officer in officers:
                        Notification.objects.create(alert=alert, officer=officer)

                    # Push to Node.js
                    node_url = getattr(settings, 'NODE_SERVICE_URL', None)
                    if node_url:
                        try:
                            requests.post(f'{node_url}/api/alerts/push', json={
                                'alert_id': alert.id,
                                'missing_person_name': case_name,
                                'camera_name': camera.name if camera else 'Simulation',
                                'camera_location': camera.location_name if camera else 'Local',
                                'confidence_score': round(confidence, 4),
                                'officer_ids': [o.id for o in officers],
                                'snapshot_url': alert.snapshot.url if alert.snapshot else None,
                            }, timeout=5)
                        except Exception as e:
                            logger.warning('Failed to push to Node: %s', e)

                logger.info('Simulation alert #%d: %s (confidence=%.2f)', alert.id, case_name, confidence)

    return Response({
        'status': 'complete',
        'faces_found': len(face_locations),
        'matches': len(alerts_created),
        'alerts': alerts_created,
    })
