"""
Alerts app — DRF Serializers
"""
from rest_framework import serializers
from django.utils import timezone

from cases.serializers import MissingPersonListSerializer
from cameras.serializers import CCTVCameraSerializer
from accounts.serializers import UserSerializer
from .models import DetectionAlert, Notification


class DetectionAlertListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing alerts."""
    missing_person_name = serializers.CharField(source='missing_person.name', read_only=True)
    camera_name = serializers.CharField(source='camera.name', read_only=True)

    class Meta:
        model = DetectionAlert
        fields = [
            'id', 'missing_person', 'missing_person_name',
            'camera', 'camera_name', 'confidence_score',
            'detected_at', 'status',
        ]


class DetectionAlertDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer with nested case and camera info."""
    missing_person = MissingPersonListSerializer(read_only=True)
    camera = CCTVCameraSerializer(read_only=True)
    verified_by = UserSerializer(read_only=True)
    snapshot_url = serializers.SerializerMethodField()

    class Meta:
        model = DetectionAlert
        fields = [
            'id', 'missing_person', 'camera', 'snapshot', 'snapshot_url',
            'confidence_score', 'detected_at', 'status',
            'verified_by', 'verified_at',
        ]

    def get_snapshot_url(self, obj):
        request = self.context.get('request')
        if obj.snapshot:
            if request:
                return request.build_absolute_uri(obj.snapshot.url)
            return obj.snapshot.url
        return None


class DetectionAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for internal alert creation (used by Celery tasks)."""

    class Meta:
        model = DetectionAlert
        fields = [
            'id', 'missing_person', 'camera', 'snapshot',
            'confidence_score',
        ]
        read_only_fields = ['id']


class AlertVerifySerializer(serializers.Serializer):
    """Serializer for verifying or dismissing an alert."""
    status = serializers.ChoiceField(
        choices=[('VERIFIED', 'Verified'), ('DISMISSED', 'Dismissed')],
    )


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for officer notifications."""
    alert_id = serializers.IntegerField(source='alert.id', read_only=True)
    missing_person_name = serializers.CharField(
        source='alert.missing_person.name', read_only=True,
    )
    camera_name = serializers.CharField(
        source='alert.camera.name', read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'alert_id', 'missing_person_name', 'camera_name',
            'sent_at', 'is_read',
        ]
        read_only_fields = ['id', 'sent_at']
