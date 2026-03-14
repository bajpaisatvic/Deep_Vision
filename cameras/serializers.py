"""
Cameras app — DRF Serializers
"""
from rest_framework import serializers
from .models import CCTVCamera


class CCTVCameraSerializer(serializers.ModelSerializer):
    """Serializer for CCTV camera CRUD."""

    class Meta:
        model = CCTVCamera
        fields = [
            'id', 'name', 'location_name', 'latitude', 'longitude',
            'stream_url', 'is_active', 'zone', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
