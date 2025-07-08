import os
import django
from django.conf import settings
from django.core.management import execute_from_command_line

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')

# Change to the Django directory
os.chdir('backend/django_api')

# Configure Django
django.setup()

# Run migrations
print("Applying migrations...")
execute_from_command_line(['manage.py', 'migrate'])
print("Migrations completed!")
