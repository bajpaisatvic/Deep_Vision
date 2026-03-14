"""
Alerts app — Models for detection alerts and notifications.
"""
from django.conf import settings
from django.db import models


class DetectionAlert(models.Model):
    """
    Alert generated when a face match is found between a
    CCTV frame and a registered missing person.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'
        DISMISSED = 'DISMISSED', 'Dismissed'

    missing_person = models.ForeignKey(
        'cases.MissingPerson',
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    camera = models.ForeignKey(
        'cameras.CCTVCamera',
        on_delete=models.SET_NULL,
        related_name='alerts',
        null=True,
        blank=True,
    )
    snapshot = models.ImageField(
        upload_to='alert_snapshots/',
        help_text='Captured frame at the time of match.',
    )
    confidence_score = models.FloatField(
        help_text='Face match confidence score (0.0 - 1.0).',
    )
    detected_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_alerts',
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-detected_at']
        verbose_name = 'Detection Alert'

    def __str__(self):
        return f'Alert #{self.pk} — {self.missing_person.name} ({self.get_status_display()})'


class Notification(models.Model):
    """
    Notification sent to a police officer about a detection alert.
    """
    alert = models.ForeignKey(
        DetectionAlert,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f'Notification for {self.officer.username} — Alert #{self.alert_id}'
