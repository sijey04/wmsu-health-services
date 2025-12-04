from django.db import connection

# Remove the migration records
migrations_to_remove = [
    '0055_2_empty_placeholder',
    '0056_a_empty_placeholder',
    '0058_merge_20250716_1108',
]

with connection.cursor() as cursor:
    for migration_name in migrations_to_remove:
        cursor.execute(
            "DELETE FROM django_migrations WHERE app = %s AND name = %s",
            ['api', migration_name]
        )
        print(f"✓ Removed {migration_name} from database")

print("\nMigration records cleaned! Now run: python manage.py migrate")
