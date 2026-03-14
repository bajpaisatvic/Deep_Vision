"""
Alerts app — DRF ViewSets
"""
from django.utils import timezone
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from accounts.permissions import IsPoliceOrAdmin
from .models import DetectionAlert, Notification
from .serializers import (
    DetectionAlertListSerializer,
    DetectionAlertDetailSerializer,
    DetectionAlertCreateSerializer,
    AlertVerifySerializer,
    NotificationSerializer,
)


class DetectionAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for detection alerts with verify/dismiss action.

    - GET   /api/alerts/              — List alerts with filters
    - GET   /api/alerts/<id>/         — Alert detail with snapshot + case info
    - PATCH /api/alerts/<id>/verify/  — Police verifies or dismisses
    """
    permission_classes = [IsAuthenticated, IsPoliceOrAdmin]
    filterset_fields = ['status', 'camera', 'missing_person']

    def get_queryset(self):
        return (
            DetectionAlert.objects
            .select_related('missing_person', 'camera', 'verified_by')
            .all()
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return DetectionAlertListSerializer
        return DetectionAlertDetailSerializer

    @action(detail=True, methods=['patch'], url_path='verify')
    def verify(self, request, pk=None):
        """
        PATCH /api/alerts/<id>/verify/ — Verify or dismiss an alert.
        On VERIFIED: also marks the missing person case as FOUND,
        so their embeddings are excluded from future searches.
        """
        alert = self.get_object()
        serializer = AlertVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        alert.status = new_status
        alert.verified_by = request.user
        alert.verified_at = timezone.now()
        alert.save(update_fields=['status', 'verified_by', 'verified_at'])

        # On VERIFIED → mark the case as FOUND to stop further searches
        if new_status == 'VERIFIED' and alert.missing_person:
            alert.missing_person.status = 'FOUND'
            alert.missing_person.save(update_fields=['status'])

        return Response(DetectionAlertDetailSerializer(alert, context={'request': request}).data)


class InternalAlertCreateView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/alerts/internal/create/ — Internal endpoint for Celery tasks.
    In production, secure this via API key or internal network.
    """
    queryset = DetectionAlert.objects.all()
    serializer_class = DetectionAlertCreateSerializer
    permission_classes = [AllowAny]  # Secured at network level in production


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Notifications for police officers.

    - GET   /api/notifications/           — Officer's own notifications
    - PATCH /api/notifications/<id>/read/ — Mark notification as read
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(officer=self.request.user)
            .select_related('alert', 'alert__missing_person', 'alert__camera')
        )

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        """PATCH /api/notifications/<id>/read/ — Mark as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)
