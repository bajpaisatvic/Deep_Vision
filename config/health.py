"""
Deep Vision — Health Check Endpoint
Returns status of DB, Redis, and Celery.
"""
import logging
from django.http import JsonResponse
from django.db import connection

logger = logging.getLogger(__name__)


def health_check(request):
    """GET /api/health/ — Returns DB, Redis, and Celery status."""
    status = {
        'database': 'ok',
        'redis': 'ok',
        'celery': 'ok',
    }
    http_status = 200

    # ── Database check ───────────────────────────────────────────
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except Exception as exc:
        logger.error('Health check — DB failure: %s', exc)
        status['database'] = 'error'
        http_status = 503

    # ── Redis check ──────────────────────────────────────────────
    try:
        import redis as redis_lib
        from django.conf import settings
        r = redis_lib.from_url(settings.CELERY_BROKER_URL)
        r.ping()
    except Exception as exc:
        logger.error('Health check — Redis failure: %s', exc)
        status['redis'] = 'error'
        http_status = 503

    # ── Celery check ─────────────────────────────────────────────
    try:
        from config.celery import app as celery_app
        insp = celery_app.control.inspect()
        if not insp.ping():
            status['celery'] = 'unavailable'
    except Exception as exc:
        logger.error('Health check — Celery failure: %s', exc)
        status['celery'] = 'error'
        http_status = 503

    return JsonResponse({'status': 'healthy' if http_status == 200 else 'degraded', **status}, status=http_status)
