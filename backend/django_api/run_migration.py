#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.core.management import execute_from_command_line

if __name__ == "__main__":
    # Run the migrate command
    execute_from_command_line(['manage.py', 'migrate', 'api'])
