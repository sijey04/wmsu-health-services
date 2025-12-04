#!/usr/bin/env python
"""
Test if standard MySQL backend works with current MariaDB version
"""
import os
import sys
import django
from django.core.exceptions import ImproperlyConfigured
from django.db import connection

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')

# Temporarily override the database engine
os.environ['DATABASE_ENGINE'] = 'django.db.backends.mysql'

try:
    django.setup()
    
    # Test connection with standard MySQL backend
    print("Testing standard MySQL backend...")
    cursor = connection.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"✅ Standard MySQL backend works! Database version: {version[0]}")
    print(f"MariaDB version: {connection.mysql_version}")
    
    # Test a simple model query
    from api.models import CustomUser
    user_count = CustomUser.objects.count()
    print(f"✅ Model queries work! User count: {user_count}")
    
except Exception as e:
    print(f"❌ Standard MySQL backend failed: {e}")
    print("Custom mysql_compat backend is still needed")
