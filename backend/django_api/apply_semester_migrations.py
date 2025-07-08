import django
import os
import sys
from pathlib import Path

# Add the project root to the Python path
script_dir = Path(__file__).resolve().parent
project_root = script_dir
sys.path.append(str(project_root))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

# Import needed Django components
from django.core.management import call_command
from django.db import connection

# Check if the table already exists
def check_table_exists(table_name):
    with connection.cursor() as cursor:
        tables = connection.introspection.table_names()
        return table_name in tables

# Delete migration if table doesn't exist but migration file does
if not check_table_exists('api_academicsemester'):
    print("Table doesn't exist, ensuring clean migration...")
    try:
        from django.db import migrations
        from django.db.migrations.recorder import MigrationRecorder
        # Remove migration record if it exists
        migration_recorder = MigrationRecorder(connection)
        migration_recorder.migration_qs.filter(app='api', name='0002_academicsemester').delete()
        print("Cleaned previous migration records")
    except Exception as e:
        print(f"Note: {e}")

# Create and apply migrations
print("Creating migrations for the AcademicSemester model...")
call_command('makemigrations', 'api')
print("Applying migrations...")
call_command('migrate', 'api')

print("Migration completed successfully!")

# Verify the table was created
if check_table_exists('api_academicsemester'):
    print("Table 'api_academicsemester' successfully created!")
else:
    print("ERROR: Table 'api_academicsemester' was not created!")
