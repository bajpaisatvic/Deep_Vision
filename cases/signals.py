"""
Cases app — Signals for async embedding generation.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import MissingPersonImage


@receiver(post_save, sender=MissingPersonImage)
def trigger_embedding_generation(sender, instance, created, **kwargs):
    """
    After a MissingPersonImage is saved, enqueue a Celery task
    to generate the face embedding asynchronously.
    """
    if created:
        from vision.tasks import generate_embedding_for_case_image
        generate_embedding_for_case_image.delay(instance.id)
