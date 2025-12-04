import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection

# Mark the missing migrations as applied
migrations_to_fake = [
    '0056_a_empty_placeholder',
]

with connection.cursor() as cursor:
    for migration_name in migrations_to_fake:
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
            ['api', migration_name, datetime.now()]
        )
        print(f"✓ Marked {migration_name} as applied")

print("\nMigration consistency fixed! Now run: python manage.py migrate")
