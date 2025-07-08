#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line

# Change to the Django directory
os.chdir('backend/django_api')

# Add the current directory to Python path
sys.path.append('.')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

print("Applying Django migrations...")

try:
    # Apply migrations
    execute_from_command_line(['manage.py', 'migrate'])
    print("✅ Migrations applied successfully!")
except Exception as e:
    print(f"❌ Error applying migrations: {e}")
