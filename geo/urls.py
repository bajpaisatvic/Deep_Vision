"""
Geo app — URL configuration
"""
from django.urls import path
from .views import OfficersNearbyView

app_name = 'geo'

urlpatterns = [
    path('officers-nearby/', OfficersNearbyView.as_view(), name='officers-nearby'),
]
