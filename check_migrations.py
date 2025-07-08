import os
import sys

# Add the Django project to the Python path
sys.path.insert(0, r'C:\xampp\htdocs\wmsuhealthservices\backend\django_api')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')

import django
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection

print("=== Django Migration Status Check ===")

try:
    # Check if we can connect to the database
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("✅ Database connection successful")
    
    # Check migration status
    from django.db.migrations.executor import MigrationExecutor
    executor = MigrationExecutor(connection)
    
    # Get unapplied migrations
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    
    if plan:
        print(f"❌ {len(plan)} unapplied migrations found:")
        for migration, backwards in plan:
            print(f"  - {migration.app_label}.{migration.name}")
    else:
        print("✅ All migrations are applied")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
