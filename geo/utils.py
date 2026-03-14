"""
Geo app — Geofencing utility functions.
"""
import math
from typing import List

from django.contrib.auth import get_user_model

User = get_user_model()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.

    Args:
        lat1, lon1: Coordinates of point 1 (degrees).
        lat2, lon2: Coordinates of point 2 (degrees).

    Returns:
        Distance in meters.
    """
    R = 6371000  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def get_officers_within_radius(
    lat: float,
    lng: float,
    radius_meters: float,
) -> List:
    """
    Find active police officers within a given radius of a point.

    Uses a bounding box pre-filter for efficiency, then applies
    the Haversine formula for precise distance filtering.

    Args:
        lat: Latitude of the center point.
        lng: Longitude of the center point.
        radius_meters: Radius in meters to search within.

    Returns:
        List of User objects (police officers) within the radius.
    """
    # Approximate bounding box for faster DB query
    # 1 degree latitude ≈ 111,320 meters
    lat_delta = radius_meters / 111320.0
    # 1 degree longitude varies by latitude
    lng_delta = radius_meters / (111320.0 * math.cos(math.radians(lat)))

    # Pre-filter with bounding box
    candidates = User.objects.filter(
        role='POLICE',
        is_active=True,
        latitude__isnull=False,
        longitude__isnull=False,
        latitude__gte=lat - lat_delta,
        latitude__lte=lat + lat_delta,
        longitude__gte=lng - lng_delta,
        longitude__lte=lng + lng_delta,
    )

    # Precise Haversine filter
    nearby_officers = []
    for officer in candidates:
        distance = haversine_distance(lat, lng, officer.latitude, officer.longitude)
        if distance <= radius_meters:
            nearby_officers.append(officer)

    return nearby_officers
