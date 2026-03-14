"""
Pytest configuration for Deep Vision backend.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an unauthenticated DRF API client."""
    return APIClient()


@pytest.fixture
def citizen_user(db):
    """Create and return a citizen user."""
    return User.objects.create_user(
        username='citizen_test',
        email='citizen@test.com',
        password='TestPass123!',
        role='CITIZEN',
        phone_number='1234567890',
    )


@pytest.fixture
def police_user(db):
    """Create and return a police officer user."""
    return User.objects.create_user(
        username='officer_test',
        email='officer@test.com',
        password='TestPass123!',
        role='POLICE',
        phone_number='0987654321',
        badge_number='BADGE-001',
        assigned_zone='Zone A',
        latitude=28.6139,
        longitude=77.2090,
    )


@pytest.fixture
def admin_user(db):
    """Create and return an admin user."""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='TestPass123!',
        role='ADMIN',
    )


@pytest.fixture
def citizen_client(api_client, citizen_user):
    """Return an API client authenticated as a citizen."""
    api_client.force_authenticate(user=citizen_user)
    return api_client


@pytest.fixture
def police_client(api_client, police_user):
    """Return an API client authenticated as a police officer."""
    api_client.force_authenticate(user=police_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an API client authenticated as an admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client
