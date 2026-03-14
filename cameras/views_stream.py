"""
Cameras app — MJPEG Streaming + Background Batch Face Capture

Two separate concerns:
1. MJPEG stream generator — serves frames to the browser UNINTERRUPTED
2. Background capture thread — collects face frames over a batch window (~20s),
   then queues a single Celery task to process the entire batch at once.

The heavy recognition never blocks the stream.
"""
import os
import time
import logging
import threading
from datetime import datetime

import cv2
from django.conf import settings
from django.http import StreamingHttpResponse, JsonResponse

from .models import CCTVCamera

logger = logging.getLogger(__name__)

# Global camera registry
_active_cameras = {}
_capture_threads = {}

# Directory for captured face frames
CAPTURE_DIR = os.path.join(settings.MEDIA_ROOT, 'captured_frames')
os.makedirs(CAPTURE_DIR, exist_ok=True)

# Batch settings
CAPTURE_INTERVAL = 3      # seconds between face detection checks
BATCH_WINDOW = 20          # seconds — collect frames, then send batch to Celery


# ── Background Batch Face Capture Thread ────────────────────────

def _face_capture_loop(cap, camera_id, camera_key, stop_event):
    """
    Runs in a background thread alongside the MJPEG stream.
    Every CAPTURE_INTERVAL seconds, checks for faces using Haar cascade.
    After BATCH_WINDOW seconds, sends all collected frame paths to Celery
    as a single batch task.
    """
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    logger.info('Face capture thread started for camera %s (batch=%ds, interval=%ds)',
                camera_key, BATCH_WINDOW, CAPTURE_INTERVAL)

    while not stop_event.is_set():
        batch_paths = []
        batch_start = time.time()

        # ── Collect frames for BATCH_WINDOW seconds ──
        while (time.time() - batch_start) < BATCH_WINDOW:
            if stop_event.is_set():
                break

            time.sleep(CAPTURE_INTERVAL)

            try:
                ret, frame = cap.read()
                if not ret or frame is None:
                    continue

                # Fast face detection with Haar cascade
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
                )

                if len(faces) == 0:
                    continue

                # Face(s) found — save frame
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                filename = f'cam_{camera_id}_{timestamp}.jpg'
                filepath = os.path.join(CAPTURE_DIR, filename)
                cv2.imwrite(filepath, frame)
                batch_paths.append(filepath)

                logger.info(
                    'Captured %d face(s) from %s → %s (%d in batch)',
                    len(faces), camera_key, filename, len(batch_paths),
                )

            except Exception as e:
                if not stop_event.is_set():
                    logger.error('Capture error for %s: %s', camera_key, e)

        # ── Batch complete — send to Celery ──
        if batch_paths and not stop_event.is_set():
            logger.info(
                '📦 Batch ready for %s: %d frame(s) collected over %ds — sending to Celery',
                camera_key, len(batch_paths), BATCH_WINDOW,
            )
            try:
                from vision.tasks import match_captured_frames_batch
                match_captured_frames_batch.delay(batch_paths, camera_id)
            except Exception as e:
                logger.error('Failed to queue batch task: %s', e)
        elif not batch_paths:
            logger.debug('No faces captured in batch window for %s', camera_key)

    logger.info('Face capture thread stopped for camera %s', camera_key)


# ── MJPEG Stream Generator ─────────────────────────────────────

def generate_mjpeg_frames(source, camera_key, camera_id):
    """
    Generator that yields MJPEG frames from a video source.
    Also starts a background face capture thread.
    """
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        logger.error('Cannot open video source: %s', source)
        return

    _active_cameras[camera_key] = cap
    logger.info('Camera %s stream started', camera_key)

    # Start background face capture thread
    stop_event = threading.Event()
    capture_thread = threading.Thread(
        target=_face_capture_loop,
        args=(cap, camera_id, camera_key, stop_event),
        daemon=True,
    )
    capture_thread.start()
    _capture_threads[camera_key] = (capture_thread, stop_event)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                ret, frame = cap.read()
                if not ret:
                    break

            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_bytes = buffer.tobytes()

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n'
                + frame_bytes +
                b'\r\n'
            )

            time.sleep(0.066)  # ~15 FPS

    except GeneratorExit:
        logger.info('Camera %s: client disconnected', camera_key)
    except Exception as e:
        logger.error('Camera %s stream error: %s', camera_key, e)
    finally:
        thread_data = _capture_threads.pop(camera_key, None)
        if thread_data:
            thread_data[1].set()

        cap.release()
        _active_cameras.pop(camera_key, None)
        logger.info('Camera %s: released', camera_key)


# ── Views ───────────────────────────────────────────────────────

def camera_stream_view(request, camera_id):
    """
    GET /api/cameras/<id>/stream/
    Returns an MJPEG stream. camera_id=0 → local webcam.
    """
    camera_key = f'cam_{camera_id}'
    _cleanup_camera(camera_key)

    if camera_id == 0:
        source = 0
    else:
        try:
            camera = CCTVCamera.objects.get(id=camera_id, is_active=True)
            source = camera.stream_url
        except CCTVCamera.DoesNotExist:
            return JsonResponse({'error': 'Camera not found or inactive.'}, status=404)

    response = StreamingHttpResponse(
        generate_mjpeg_frames(source, camera_key, camera_id),
        content_type='multipart/x-mixed-replace; boundary=frame',
    )
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


def stop_camera_view(request, camera_id):
    """POST /api/cameras/<id>/stop/ — stop stream + capture thread."""
    camera_key = f'cam_{camera_id}'
    _cleanup_camera(camera_key)
    return JsonResponse({'status': 'stopped', 'camera_id': camera_id})


def _cleanup_camera(camera_key):
    """Release camera and stop capture thread."""
    thread_data = _capture_threads.pop(camera_key, None)
    if thread_data:
        thread_data[1].set()

    cap = _active_cameras.pop(camera_key, None)
    if cap is not None:
        try:
            cap.release()
        except Exception:
            pass
        logger.info('Camera %s: force-stopped', camera_key)
