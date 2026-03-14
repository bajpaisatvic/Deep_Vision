"""
Alerts app — URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DetectionAlertViewSet, InternalAlertCreateView, NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'internal', InternalAlertCreateView, basename='internal-alert')
router.register(r'', DetectionAlertViewSet, basename='alert')

app_name = 'alerts'

urlpatterns = [
    path('', include(router.urls)),
]
