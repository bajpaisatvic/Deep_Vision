"""
Management command: simulate_detection

Opens local webcam, runs face detection loop against stored missing person
embeddings, creates DetectionAlerts, and pushes notifications.

Usage: python manage.py simulate_detection [--duration SECONDS] [--camera INDEX]
"""
import time
import logging
import cv2
import numpy as np
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Simulate face detection using local webcam against stored missing person embeddings.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--duration', type=int, default=30,
            help='Duration in seconds to run the simulation (default: 30)',
        )
        parser.add_argument(
            '--camera', type=int, default=0,
            help='Camera index (default: 0 for built-in webcam)',
        )

    def handle(self, *args, **options):
        import face_recognition
        from cases.models import MissingPersonImage
        from alerts.models import DetectionAlert, Notification
        from cameras.models import CCTVCamera
        from geo.utils import get_officers_within_radius

        duration = options['duration']
        camera_idx = options['camera']
        threshold = getattr(settings, 'FACE_MATCH_THRESHOLD', 0.5)

        # Fetch stored embeddings
        stored = list(
            MissingPersonImage.objects
            .filter(face_embedding__isnull=False, case__status='ACTIVE')
            .select_related('case')
            .values_list('id', 'case_id', 'case__name', 'face_embedding')
        )

        if not stored:
            self.stdout.write(self.style.WARNING(
                'No missing person embeddings found. Upload images first.'
            ))
            return

        self.stdout.write(f'Loaded {len(stored)} embedding(s) for matching.')

        # Get a camera for alert records
        db_camera = CCTVCamera.objects.filter(is_active=True).first()

        # Open webcam
        cap = cv2.VideoCapture(camera_idx)
        if not cap.isOpened():
            self.stdout.write(self.style.ERROR(f'Cannot open camera {camera_idx}.'))
            return

        self.stdout.write(self.style.SUCCESS(
            f'\n🎥 Simulation started — running for {duration}s. Press Ctrl+C to stop.\n'
        ))

        start_time = time.time()
        frame_count = 0
        alerts_count = 0

        try:
            while time.time() - start_time < duration:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1

                # Process every 5th frame for performance
                if frame_count % 5 != 0:
                    # Show frame with overlay
                    cv2.putText(frame, f'Deep Vision - Scanning... (Frame {frame_count})',
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    cv2.imshow('Deep Vision - Live Detection', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                    continue

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_frame, model='hog')

                # Draw face boxes
                for (top, right, bottom, left) in face_locations:
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

                if face_locations:
                    encodings = face_recognition.face_encodings(rgb_frame, known_face_locations=face_locations)

                    for encoding in encodings:
                        cctv_vec = np.array(encoding)

                        for img_id, case_id, case_name, emb_json in stored:
                            stored_vec = np.array(emb_json)
                            distance = float(np.linalg.norm(cctv_vec - stored_vec))

                            if distance <= threshold:
                                confidence = max(0.0, 1.0 - distance)

                                # Save snapshot
                                _, buf = cv2.imencode('.jpg', frame)
                                snapshot = ContentFile(buf.tobytes(), name=f'sim_{case_id}.jpg')

                                alert = DetectionAlert.objects.create(
                                    missing_person_id=case_id,
                                    camera=db_camera,
                                    snapshot=snapshot,
                                    confidence_score=round(confidence, 4),
                                )
                                alerts_count += 1

                                # Draw match label
                                cv2.putText(
                                    frame, f'MATCH: {case_name} ({confidence:.0%})',
                                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2,
                                )

                                self.stdout.write(self.style.SUCCESS(
                                    f'  🚨 MATCH: {case_name} — Confidence: {confidence:.1%} — Alert #{alert.id}'
                                ))

                                # Create notifications + push to Node
                                if db_camera:
                                    officers = get_officers_within_radius(
                                        db_camera.latitude, db_camera.longitude,
                                        getattr(settings, 'GEOFENCE_RADIUS_METERS', 100) * 100,
                                    )
                                    for officer in officers:
                                        Notification.objects.create(alert=alert, officer=officer)

                                    node_url = getattr(settings, 'NODE_SERVICE_URL', None)
                                    if node_url:
                                        try:
                                            requests.post(f'{node_url}/api/alerts/push', json={
                                                'alert_id': alert.id,
                                                'missing_person_name': case_name,
                                                'camera_name': db_camera.name if db_camera else 'Webcam',
                                                'camera_location': db_camera.location_name if db_camera else 'Local',
                                                'confidence_score': round(confidence, 4),
                                                'officer_ids': [o.id for o in officers],
                                            }, timeout=3)
                                        except Exception:
                                            pass

                # Show frame
                cv2.putText(frame, f'Deep Vision - Scanning... (Frame {frame_count})',
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow('Deep Vision - Live Detection', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        except KeyboardInterrupt:
            self.stdout.write('\n⏹️ Simulation stopped by user.')
        finally:
            cap.release()
            cv2.destroyAllWindows()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Simulation complete: {frame_count} frames processed, {alerts_count} alert(s) created.'
        ))
