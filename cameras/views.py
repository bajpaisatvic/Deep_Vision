"""
Cameras app — DRF ViewSets
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin, IsPoliceOrAdmin
from .models import CCTVCamera
from .serializers import CCTVCameraSerializer


class CCTVCameraViewSet(viewsets.ModelViewSet):
    """
    CRUD for CCTV cameras.

    - GET    /api/cameras/       — List cameras (police/admin)
    - POST   /api/cameras/       — Register camera (admin only)
    - GET    /api/cameras/<id>/  — Camera detail
    - PATCH  /api/cameras/<id>/  — Update (admin only)
    - DELETE /api/cameras/<id>/  — Delete (admin only)
    """
    queryset = CCTVCamera.objects.all()
    serializer_class = CCTVCameraSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated(), IsPoliceOrAdmin()]
        return [IsAuthenticated(), IsAdmin()]
