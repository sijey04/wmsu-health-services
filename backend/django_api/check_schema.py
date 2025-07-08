import os
import sys
import django

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection
from api.models import MedicalDocument

def check_and_update_my_documents():
    """
    Check if academic_year_id column exists and update the my_documents method accordingly
    """
    print("Checking database schema...")
    
    try:
        with connection.cursor() as cursor:
            # Check if academic_year_id column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            if column_exists:
                print("✓ academic_year_id column exists - can use ORM normally")
                
                # Test ORM query
                try:
                    count = MedicalDocument.objects.count()
                    print(f"✓ MedicalDocument ORM query works: {count} records")
                    
                    # Test accessing academic_year field
                    if count > 0:
                        first_doc = MedicalDocument.objects.first()
                        academic_year = first_doc.academic_year
                        print(f"✓ academic_year field accessible: {academic_year}")
                        
                except Exception as e:
                    print(f"✗ ORM query failed: {e}")
                    
            else:
                print("✗ academic_year_id column missing - using raw SQL fallback")
                
                # Test raw SQL query
                try:
                    cursor.execute("SELECT COUNT(*) FROM api_medicaldocument")
                    count = cursor.fetchone()[0]
                    print(f"✓ Raw SQL query works: {count} records")
                except Exception as e:
                    print(f"✗ Raw SQL query failed: {e}")
                    
    except Exception as e:
        print(f"✗ Database check failed: {e}")

if __name__ == "__main__":
    check_and_update_my_documents()
