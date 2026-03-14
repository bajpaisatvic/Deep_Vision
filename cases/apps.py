from django.apps import AppConfig


class CasesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cases'
    verbose_name = 'Missing Person Cases'

    def ready(self):
        import cases.signals  # noqa: F401
