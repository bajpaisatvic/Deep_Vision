"""
Accounts app — DRF Permission Classes
"""
from rest_framework.permissions import BasePermission


class IsCitizen(BasePermission):
    """Allows access only to users with CITIZEN role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'CITIZEN'
        )


class IsPolice(BasePermission):
    """Allows access only to users with POLICE role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'POLICE'
        )


class IsAdmin(BasePermission):
    """Allows access only to users with ADMIN role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsPoliceOrAdmin(BasePermission):
    """Allows access to users with POLICE or ADMIN role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('POLICE', 'ADMIN')
        )
