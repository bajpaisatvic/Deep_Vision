"""
Geo app — Views for geofencing endpoints.
"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsPoliceOrAdmin
from accounts.serializers import UserSerializer
from .utils import get_officers_within_radius


class OfficersNearbyView(APIView):
    """
    GET /api/geo/officers-nearby/?lat=&lng=&radius=
    Returns active police officers within the given radius.
    """
    permission_classes = [IsAuthenticated, IsPoliceOrAdmin]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', 0))
            lng = float(request.query_params.get('lng', 0))
            radius = float(request.query_params.get('radius', 100))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Invalid lat, lng, or radius parameters.'},
                status=400,
            )

        officers = get_officers_within_radius(lat, lng, radius)
        serializer = UserSerializer(officers, many=True)
        return Response({
            'count': len(officers),
            'radius_meters': radius,
            'officers': serializer.data,
        })
