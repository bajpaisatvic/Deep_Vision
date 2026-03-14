"""
Accounts app — Django Admin configuration
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'phone_number', 'assigned_zone', 'is_active']
    list_filter = ['role', 'is_active', 'mfa_enabled']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'badge_number']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Deep Vision', {
            'fields': ('role', 'phone_number', 'badge_number', 'assigned_zone',
                       'mfa_enabled', 'latitude', 'longitude'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Deep Vision', {
            'fields': ('role', 'phone_number', 'badge_number', 'assigned_zone'),
        }),
    )
