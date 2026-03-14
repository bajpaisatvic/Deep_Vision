"""
Vision module — Utility helpers for image handling and validation.
"""
import os
import logging

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
MAX_IMAGE_SIZE_MB = 10


class NoFaceDetectedException(Exception):
    """Raised when no face is detected in an image."""
    pass


class InvalidImageException(Exception):
    """Raised when an uploaded image fails validation."""
    pass


def validate_image_file(file_path: str) -> None:
    """
    Validate that the file exists, has an allowed extension,
    and is within the size limit.

    Raises:
        InvalidImageException: If validation fails.
    """
    if not os.path.exists(file_path):
        raise InvalidImageException(f'File not found: {file_path}')

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise InvalidImageException(
            f'Invalid file type "{ext}". Allowed: {ALLOWED_IMAGE_EXTENSIONS}'
        )

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise InvalidImageException(
            f'File too large ({size_mb:.1f} MB). Max: {MAX_IMAGE_SIZE_MB} MB.'
        )


def bytes_to_numpy(frame_bytes: bytes):
    """Convert raw frame bytes to a numpy array (BGR image)."""
    import numpy as np
    import cv2

    nparr = np.frombuffer(frame_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise InvalidImageException('Failed to decode frame bytes to image.')
    return img


def numpy_to_rgb(bgr_image):
    """Convert a BGR OpenCV image to RGB (required by face_recognition)."""
    import cv2
    return cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
