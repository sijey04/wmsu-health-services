from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """
        This method is called when Django starts.
        We can use it to register signals or perform other initialization.
        Note: Do not import models here to avoid circular imports.
        """
        pass
