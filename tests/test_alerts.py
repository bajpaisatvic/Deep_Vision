"""
Tests — Alerts app (alert creation flow, verification)
"""
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model

from cases.models import MissingPerson
from cameras.models import CCTVCamera
from alerts.models import DetectionAlert, Notification

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def sample_case(citizen_user):
    """Create a sample missing person case."""
    return MissingPerson.objects.create(
        name='Alert Test Person',
        age=28,
        gender='FEMALE',
        reported_by=citizen_user,
    )


@pytest.fixture
def sample_camera():
    """Create a sample CCTV camera."""
    return CCTVCamera.objects.create(
        name='Test Camera',
        location_name='Main Street',
        latitude=28.6139,
        longitude=77.2090,
        stream_url='rtsp://example.com/stream',
    )


@pytest.fixture
def sample_alert(sample_case, sample_camera):
    """Create a sample detection alert."""
    return DetectionAlert.objects.create(
        missing_person=sample_case,
        camera=sample_camera,
        confidence_score=0.85,
    )


class TestAlertListAndDetail:
    """Test alert listing and detail endpoints."""

    def test_police_can_list_alerts(self, police_client, sample_alert):
        """Police officers can list alerts."""
        url = reverse('alerts:alert-list')
        response = police_client.get(url)
        assert response.status_code == 200

    def test_police_can_view_alert_detail(self, police_client, sample_alert):
        """Police officers can view alert detail."""
        url = reverse('alerts:alert-detail', args=[sample_alert.id])
        response = police_client.get(url)
        assert response.status_code == 200
        assert response.data['confidence_score'] == 0.85


class TestAlertVerification:
    """Test alert verification/dismissal by police."""

    def test_police_can_verify_alert(self, police_client, sample_alert, police_user):
        """Police can verify an alert."""
        url = reverse('alerts:alert-verify', args=[sample_alert.id])
        response = police_client.patch(url, {'status': 'VERIFIED'}, format='json')
        assert response.status_code == 200
        sample_alert.refresh_from_db()
        assert sample_alert.status == 'VERIFIED'
        assert sample_alert.verified_by == police_user

    def test_police_can_dismiss_alert(self, police_client, sample_alert):
        """Police can dismiss an alert."""
        url = reverse('alerts:alert-verify', args=[sample_alert.id])
        response = police_client.patch(url, {'status': 'DISMISSED'}, format='json')
        assert response.status_code == 200
        sample_alert.refresh_from_db()
        assert sample_alert.status == 'DISMISSED'


class TestNotifications:
    """Test notification endpoints."""

    def test_officer_sees_own_notifications(self, police_client, police_user, sample_alert):
        """Officers see only their own notifications."""
        Notification.objects.create(alert=sample_alert, officer=police_user)
        url = reverse('alerts:notification-list')
        response = police_client.get(url)
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_mark_notification_read(self, police_client, police_user, sample_alert):
        """Officer can mark a notification as read."""
        notif = Notification.objects.create(alert=sample_alert, officer=police_user)
        url = reverse('alerts:notification-mark-read', args=[notif.id])
        response = police_client.patch(url, format='json')
        assert response.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read is True
