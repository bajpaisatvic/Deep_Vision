"""
Cases app — Django Admin configuration
"""
from django.contrib import admin
from .models import MissingPerson, MissingPersonImage


class MissingPersonImageInline(admin.TabularInline):
    model = MissingPersonImage
    extra = 0
    readonly_fields = ['face_embedding', 'uploaded_at']


@admin.register(MissingPerson)
class MissingPersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'age', 'gender', 'status', 'reported_by', 'registered_at']
    list_filter = ['status', 'gender', 'registered_at']
    search_fields = ['name', 'description', 'last_seen_location']
    inlines = [MissingPersonImageInline]
    readonly_fields = ['registered_at']


@admin.register(MissingPersonImage)
class MissingPersonImageAdmin(admin.ModelAdmin):
    list_display = ['case', 'is_primary', 'uploaded_at']
    list_filter = ['is_primary']
    search_fields = ['case__name']
