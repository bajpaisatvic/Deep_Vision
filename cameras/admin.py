"""
Cameras app — Django Admin configuration
"""
from django.contrib import admin
from .models import CCTVCamera


@admin.register(CCTVCamera)
class CCTVCameraAdmin(admin.ModelAdmin):
    list_display = ['name', 'location_name', 'zone', 'is_active', 'created_at']
    list_filter = ['is_active', 'zone']
    search_fields = ['name', 'location_name', 'zone']
