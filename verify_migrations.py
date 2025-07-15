#!/usr/bin/env python
"""
Simple Migration Status Checker
Quick verification that migrations are working
"""

import os
import sys
import django

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')

try:
    django.setup()
    from django.core.management import execute_from_command_line
    from django.db import connection
    
    print("=" * 50)
    print("WMSU Health Services - Migration Status Check")
    print("=" * 50)
    
    # Test database connection
    print("\n1. Testing database connection...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Check migration status
    print("\n2. Checking migration status...")
    try:
        execute_from_command_line(['manage.py', 'showmigrations', '--plan'])
        print("✅ Migration status checked")
    except Exception as e:
        print(f"⚠ Error checking migrations: {e}")
    
    # Run system check
    print("\n3. Running Django system check...")
    try:
        execute_from_command_line(['manage.py', 'check'])
        print("✅ System check passed")
    except Exception as e:
        print(f"⚠ System check issues: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Verification completed!")
    print("=" * 50)
    
except Exception as e:
    print(f"❌ Setup error: {e}")
    sys.exit(1)
