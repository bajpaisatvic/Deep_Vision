"""
Tests — Accounts app (registration, login, permission enforcement per role)
"""
import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


class TestRegistration:
    """Test citizen registration endpoint."""

    def test_register_citizen_success(self, api_client):
        """A new citizen can register and receives JWT tokens."""
        url = reverse('accounts:register')
        data = {
            'username': 'newcitizen',
            'email': 'new@test.com',
            'first_name': 'New',
            'last_name': 'Citizen',
            'phone_number': '5551234567',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        assert 'tokens' in response.data
        assert response.data['user']['role'] == 'CITIZEN'

    def test_register_password_mismatch(self, api_client):
        """Registration fails when passwords don't match."""
        url = reverse('accounts:register')
        data = {
            'username': 'newcitizen',
            'email': 'new@test.com',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == 400


class TestLogin:
    """Test JWT login endpoint."""

    def test_login_success(self, api_client, citizen_user):
        """A user can log in with valid credentials."""
        url = reverse('accounts:login')
        data = {'username': 'citizen_test', 'password': 'TestPass123!'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == 200
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']

    def test_login_invalid_credentials(self, api_client, citizen_user):
        """Login fails with wrong password."""
        url = reverse('accounts:login')
        data = {'username': 'citizen_test', 'password': 'WrongPass!'}
        response = api_client.post(url, data, format='json')
        assert response.status_code == 401


class TestPermissions:
    """Test role-based permission enforcement."""

    def test_citizen_cannot_access_cameras(self, citizen_client):
        """Citizens cannot list cameras (police/admin only)."""
        url = reverse('cameras:camera-list')
        response = citizen_client.get(url)
        assert response.status_code == 403

    def test_police_can_access_cameras(self, police_client):
        """Police officers can list cameras."""
        url = reverse('cameras:camera-list')
        response = police_client.get(url)
        assert response.status_code == 200

    def test_police_cannot_create_camera(self, police_client):
        """Police officers cannot create cameras (admin only)."""
        url = reverse('cameras:camera-list')
        data = {
            'name': 'Test Cam',
            'latitude': 28.6,
            'longitude': 77.2,
            'stream_url': 'rtsp://example.com/stream',
        }
        response = police_client.post(url, data, format='json')
        assert response.status_code == 403

    def test_admin_can_create_camera(self, admin_client):
        """Admin can create cameras."""
        url = reverse('cameras:camera-list')
        data = {
            'name': 'Test Cam',
            'latitude': 28.6,
            'longitude': 77.2,
            'stream_url': 'rtsp://example.com/stream',
        }
        response = admin_client.post(url, data, format='json')
        assert response.status_code == 201
