from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Check database table structure'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check multiple tables
            tables = ['api_medicaldocument', 'api_dentalformdata', 'api_medicalformdata']
            
            for table in tables:
                try:
                    cursor.execute(f"SHOW COLUMNS FROM {table}")
                    columns = cursor.fetchall()
                    
                    self.stdout.write(f"\n{table} table columns:")
                    for column in columns:
                        self.stdout.write(f"  - {column[0]} ({column[1]})")
                    
                    # Check if academic_year_id exists specifically
                    cursor.execute(f"SHOW COLUMNS FROM {table} LIKE 'academic_year_id'")
                    has_academic_year_col = cursor.fetchone() is not None
                    
                    self.stdout.write(f"Has academic_year_id column: {has_academic_year_col}")
                except Exception as e:
                    self.stdout.write(f"Error checking {table}: {e}")
            
            # Check migration history
            cursor.execute("SELECT * FROM django_migrations WHERE app='api' ORDER BY id DESC LIMIT 10")
            migrations = cursor.fetchall()
            
            self.stdout.write("\nRecent migrations:")
            for migration in migrations:
                self.stdout.write(f"  - {migration[1]}: {migration[2]}")
