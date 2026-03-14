"""
Management command: start_camera_scan

Enqueues scan_camera_feed Celery tasks for all active CCTV cameras.
Usage: python manage.py start_camera_scan
"""
from django.core.management.base import BaseCommand

from cameras.models import CCTVCamera
from vision.tasks import scan_camera_feed


class Command(BaseCommand):
    help = 'Enqueue Celery tasks to scan all active CCTV camera feeds.'

    def handle(self, *args, **options):
        cameras = CCTVCamera.objects.filter(is_active=True)
        count = cameras.count()

        if count == 0:
            self.stdout.write(self.style.WARNING('No active cameras found.'))
            return

        for camera in cameras:
            scan_camera_feed.delay(camera.id)
            self.stdout.write(f'  Enqueued scan for Camera #{camera.id}: {camera.name}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully enqueued {count} camera scan task(s).')
        )
