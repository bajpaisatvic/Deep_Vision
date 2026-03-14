"""
Accounts app — Custom user model with roles for citizens, police, and admins.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access and geolocation for officers."""

    class Role(models.TextChoices):
        CITIZEN = 'CITIZEN', 'Citizen'
        POLICE = 'POLICE', 'Police'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CITIZEN,
    )
    phone_number = models.CharField(max_length=20, blank=True)
    badge_number = models.CharField(
        max_length=50,
        blank=True,
        help_text='Required for police officers.',
    )
    assigned_zone = models.CharField(max_length=100, blank=True)
    mfa_enabled = models.BooleanField(default=False)

    # Officer geolocation (for geofencing queries)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    @property
    def is_citizen(self):
        return self.role == self.Role.CITIZEN

    @property
    def is_police(self):
        return self.role == self.Role.POLICE

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN
