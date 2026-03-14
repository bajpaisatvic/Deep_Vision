"""
Tests — Vision module (embedding generation with mocking)
"""
import pytest
from unittest.mock import patch, MagicMock

from vision.utils import NoFaceDetectedException

pytestmark = pytest.mark.django_db


class TestGenerateEmbedding:
    """Test face embedding generation (mocked — no actual face_recognition needed)."""

    @patch('vision.pipeline.face_recognition')
    def test_generate_embedding_success(self, mock_fr):
        """Successfully generates a 128-d embedding from a valid image."""
        import numpy as np
        from vision.pipeline import generate_embedding

        mock_fr.load_image_file.return_value = MagicMock()
        mock_fr.face_locations.return_value = [(10, 200, 200, 10)]
        mock_fr.face_encodings.return_value = [np.random.rand(128)]

        with patch('vision.pipeline.validate_image_file'):
            embedding = generate_embedding('/fake/image.jpg')

        assert len(embedding) == 128
        assert all(isinstance(v, float) for v in embedding)

    @patch('vision.pipeline.face_recognition')
    def test_generate_embedding_no_face(self, mock_fr):
        """Raises NoFaceDetectedException when no face is found."""
        from vision.pipeline import generate_embedding

        mock_fr.load_image_file.return_value = MagicMock()
        mock_fr.face_locations.return_value = []

        with patch('vision.pipeline.validate_image_file'):
            with pytest.raises(NoFaceDetectedException):
                generate_embedding('/fake/image.jpg')


class TestMatchEmbedding:
    """Test face embedding matching against stored embeddings."""

    @patch('vision.pipeline.np')
    def test_match_returns_results(self, mock_np):
        """match_embedding returns matches when distance is below threshold."""
        # This test is a stub — full integration requires DB fixtures
        pass


class TestCeleryTasks:
    """Test Celery task stubs."""

    def test_generate_embedding_task_exists(self):
        """Verify the embedding generation task is importable."""
        from vision.tasks import generate_embedding_for_case_image
        assert callable(generate_embedding_for_case_image)

    def test_scan_camera_feed_task_exists(self):
        """Verify the camera scan task is importable."""
        from vision.tasks import scan_camera_feed
        assert callable(scan_camera_feed)

    def test_notify_nearby_officers_task_exists(self):
        """Verify the notification task is importable."""
        from vision.tasks import notify_nearby_officers
        assert callable(notify_nearby_officers)
