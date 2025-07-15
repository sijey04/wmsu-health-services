#!/usr/bin/env python
"""
Migration Status Checker
Checks the current state of migrations and database
"""

import os
import sys
import django
from django.db import connection

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

def check_database_state():
    print("🔍 MIGRATION STATUS CHECK")
    print("=" * 40)
    
    try:
        # Check database connection
        print("\n1. Database Connection:")
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"✓ Connected to MySQL/MariaDB {version}")
        
        # Check if semester column exists
        print("\n2. Semester Column Status:")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND column_name = 'semester'
            """)
            exists = cursor.fetchone()[0] > 0
            print(f"{'✓' if exists else '✗'} Semester column {'exists' if exists else 'missing'}")
        
        # Check indexes
        print("\n3. Index Status:")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT index_name 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient'
                GROUP BY index_name
            """)
            indexes = [row[0] for row in cursor.fetchall()]
            print(f"✓ Found {len(indexes)} indexes on api_patient table:")
            for idx in indexes:
                print(f"  - {idx}")
        
        # Check migration status
        print("\n4. Migration Records:")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT name FROM django_migrations 
                WHERE app = 'api' 
                ORDER BY applied DESC 
                LIMIT 5
            """)
            recent_migrations = cursor.fetchall()
            print("✓ Recent migrations:")
            for migration in recent_migrations:
                print(f"  - {migration[0]}")
        
        # Check for problematic migrations
        print("\n5. Problematic Migration Check:")
        problematic = [
            '0046_add_semester_to_patient',
            '0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more'
        ]
        
        with connection.cursor() as cursor:
            for migration in problematic:
                cursor.execute("""
                    SELECT COUNT(*) FROM django_migrations 
                    WHERE app = 'api' AND name = %s
                """, [migration])
                applied = cursor.fetchone()[0] > 0
                print(f"{'✓' if applied else '✗'} {migration} {'applied' if applied else 'not applied'}")
        
        print("\n" + "=" * 40)
        print("✅ STATUS CHECK COMPLETED")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    check_database_state()
