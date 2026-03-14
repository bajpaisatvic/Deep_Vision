"""
Tests — Cases app (case CRUD, image upload)
"""
import pytest
from django.urls import reverse

from cases.models import MissingPerson

pytestmark = pytest.mark.django_db


class TestCaseCRUD:
    """Test missing person case CRUD operations."""

    def test_citizen_can_create_case(self, citizen_client, citizen_user):
        """A citizen can register a missing person case."""
        url = reverse('cases:missingperson-list')
        data = {
            'name': 'Test Person',
            'age': 25,
            'gender': 'MALE',
            'description': 'Test description',
            'last_seen_location': 'Test Location',
        }
        response = citizen_client.post(url, data, format='json')
        assert response.status_code == 201
        assert response.data['name'] == 'Test Person'

    def test_citizen_sees_only_own_cases(self, citizen_client, citizen_user):
        """Citizens can only see their own cases."""
        MissingPerson.objects.create(
            name='Own Case',
            age=30,
            gender='FEMALE',
            reported_by=citizen_user,
        )
        url = reverse('cases:missingperson-list')
        response = citizen_client.get(url)
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_police_sees_all_cases(self, police_client, citizen_user):
        """Police officers can see all cases."""
        MissingPerson.objects.create(
            name='Citizen Case',
            age=22,
            gender='MALE',
            reported_by=citizen_user,
        )
        url = reverse('cases:missingperson-list')
        response = police_client.get(url)
        assert response.status_code == 200


class TestCaseStatusUpdate:
    """Test case status update by police/admin."""

    def test_police_can_update_status(self, police_client, citizen_user):
        """Police can update case status."""
        case = MissingPerson.objects.create(
            name='Status Test',
            age=20,
            gender='MALE',
            reported_by=citizen_user,
        )
        url = reverse('cases:missingperson-update-status', args=[case.id])
        response = police_client.patch(url, {'status': 'FOUND'}, format='json')
        assert response.status_code == 200
        case.refresh_from_db()
        assert case.status == 'FOUND'

    def test_citizen_cannot_update_status(self, citizen_client, citizen_user):
        """Citizens cannot update case status."""
        case = MissingPerson.objects.create(
            name='Status Test',
            age=20,
            gender='MALE',
            reported_by=citizen_user,
        )
        url = reverse('cases:missingperson-update-status', args=[case.id])
        response = citizen_client.patch(url, {'status': 'FOUND'}, format='json')
        assert response.status_code == 403
