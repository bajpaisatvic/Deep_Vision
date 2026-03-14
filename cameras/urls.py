"""
Cameras app — URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CCTVCameraViewSet
from .views_stream import camera_stream_view, stop_camera_view
from .views_simulate import simulate_detection

router = DefaultRouter()
router.register(r'', CCTVCameraViewSet, basename='camera')

app_name = 'cameras'

urlpatterns = [
    # MJPEG streaming — /api/cameras/<id>/stream/
    path('<int:camera_id>/stream/', camera_stream_view, name='camera-stream'),

    # Stop stream — /api/cameras/<id>/stop/
    path('<int:camera_id>/stop/', stop_camera_view, name='camera-stop'),

    # Simulation — /api/cameras/simulate/
    path('simulate/', simulate_detection, name='simulate-detection'),

    # REST API
    path('', include(router.urls)),
]
