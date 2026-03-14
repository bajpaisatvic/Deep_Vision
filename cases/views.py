"""
Cases app — DRF ViewSets
"""
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsPoliceOrAdmin
from .models import MissingPerson, MissingPersonImage
from .serializers import (
    MissingPersonListSerializer,
    MissingPersonDetailSerializer,
    MissingPersonCreateSerializer,
    MissingPersonImageSerializer,
    StatusUpdateSerializer,
)


class MissingPersonViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for missing person cases.

    - POST /api/cases/             — Register missing person (any authenticated user)
    - GET  /api/cases/             — List cases (police: all; citizen: own only)
    - GET  /api/cases/<id>/        — Case detail
    - PATCH /api/cases/<id>/status/ — Update status (police/admin only)
    - POST /api/cases/<id>/images/ — Upload image (triggers async embedding)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = MissingPerson.objects.select_related('reported_by').prefetch_related('images')
        if user.role in ('POLICE', 'ADMIN'):
            return qs
        return qs.filter(reported_by=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return MissingPersonListSerializer
        if self.action == 'create':
            return MissingPersonCreateSerializer
        return MissingPersonDetailSerializer

    @action(detail=True, methods=['patch'], url_path='status',
            permission_classes=[IsAuthenticated, IsPoliceOrAdmin])
    def update_status(self, request, pk=None):
        """PATCH /api/cases/<id>/status/ — Update case status (police/admin only)."""
        case = self.get_object()
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        case.status = serializer.validated_data['status']
        case.save(update_fields=['status'])
        return Response(MissingPersonDetailSerializer(case, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='images',
            parser_classes=[parsers.MultiPartParser, parsers.FormParser])
    def upload_image(self, request, pk=None):
        """
        POST /api/cases/<id>/images/ — Upload image for a case.
        Triggers async embedding generation via Django signal.
        """
        case = self.get_object()
        serializer = MissingPersonImageSerializer(data={
            'case': case.id,
            'image': request.data.get('image'),
            'is_primary': request.data.get('is_primary', False),
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
