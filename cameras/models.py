"""
Cameras app — Model for CCTV camera streams.
"""
from django.db import models


class CCTVCamera(models.Model):
    """Registered CCTV camera with stream URL and geolocation."""

    name = models.CharField(max_length=200)
    location_name = models.CharField(max_length=300, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    stream_url = models.URLField(
        max_length=500,
        help_text='RTSP or HLS stream URL.',
    )
    is_active = models.BooleanField(default=True)
    zone = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'CCTV Camera'
        verbose_name_plural = 'CCTV Cameras'

    def __str__(self):
        return f'{self.name} — {self.location_name}'
