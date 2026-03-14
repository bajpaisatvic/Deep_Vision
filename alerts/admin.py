"""
Alerts app — Django Admin configuration
"""
from django.contrib import admin
from .models import DetectionAlert, Notification


@admin.register(DetectionAlert)
class DetectionAlertAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'missing_person', 'camera', 'confidence_score',
        'status', 'detected_at', 'verified_by',
    ]
    list_filter = ['status', 'detected_at', 'camera']
    search_fields = ['missing_person__name', 'camera__name']
    readonly_fields = ['detected_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'officer', 'alert', 'is_read', 'sent_at']
    list_filter = ['is_read', 'sent_at']
    search_fields = ['officer__username', 'alert__missing_person__name']
