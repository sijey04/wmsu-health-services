"""
WSGI config for django_api project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')

application = get_wsgi_application()
