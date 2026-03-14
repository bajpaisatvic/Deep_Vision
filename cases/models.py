"""
Cases app — Models for missing person cases and associated images.
"""
from django.conf import settings
from django.db import models


class MissingPerson(models.Model):
    """A missing person case filed by a citizen or police officer."""

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        FOUND = 'FOUND', 'Found'
        CLOSED = 'CLOSED', 'Closed'

    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=200)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=Gender.choices)
    description = models.TextField(blank=True)

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reported_cases',
    )

    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    last_seen_location = models.CharField(max_length=500, blank=True)
    last_seen_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-registered_at']
        verbose_name_plural = 'Missing Persons'

    def __str__(self):
        return f'{self.name} — {self.get_status_display()}'


class MissingPersonImage(models.Model):
    """
    Image associated with a missing person case.
    Stores the uploaded image and its 128-d face embedding.
    """
    case = models.ForeignKey(
        MissingPerson,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image = models.ImageField(upload_to='missing_persons/')
    face_embedding = models.JSONField(
        null=True,
        blank=True,
        help_text='128-d face embedding vector stored as JSON list.',
    )
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-uploaded_at']

    def __str__(self):
        return f'Image for {self.case.name} (primary={self.is_primary})'
