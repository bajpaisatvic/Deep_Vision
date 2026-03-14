"""
Cases app — URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MissingPersonViewSet

router = DefaultRouter()
router.register(r'', MissingPersonViewSet, basename='missingperson')

app_name = 'cases'

urlpatterns = [
    path('', include(router.urls)),
]
