import os
import sys
import django

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection
from api.models import MedicalDocument, Patient, CustomUser

def test_database_columns():
    """Test if we can access the database without errors"""
    
    print("Testing database columns...")
    
    # Test raw SQL query to check column existence
    with connection.cursor() as cursor:
        try:
            cursor.execute("SHOW COLUMNS FROM api_medicaldocument")
            columns = cursor.fetchall()
            print(f"Found {len(columns)} columns in api_medicaldocument table:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
            
            # Check for academic_year_id specifically
            has_academic_year = any(col[0] == 'academic_year_id' for col in columns)
            print(f"Has academic_year_id column: {has_academic_year}")
            
        except Exception as e:
            print(f"Error checking columns: {e}")
    
    # Test if we can query medical documents
    try:
        count = MedicalDocument.objects.count()
        print(f"Total medical documents: {count}")
        
        if count > 0:
            # Try to get the first document
            first_doc = MedicalDocument.objects.first()
            print(f"First document ID: {first_doc.id}")
            print(f"First document patient: {first_doc.patient}")
            
            # Test the problematic academic_year field
            try:
                academic_year = first_doc.academic_year
                print(f"Academic year: {academic_year}")
            except Exception as e:
                print(f"Error accessing academic_year: {e}")
        
    except Exception as e:
        print(f"Error querying MedicalDocument: {e}")
    
    # Test patient profiles
    try:
        user_count = CustomUser.objects.count()
        print(f"Total users: {user_count}")
        
        if user_count > 0:
            first_user = CustomUser.objects.first()
            print(f"First user: {first_user.email}")
            
            # Test get_current_patient_profile
            try:
                profile = first_user.get_current_patient_profile()
                print(f"Current patient profile: {profile}")
            except Exception as e:
                print(f"Error getting patient profile: {e}")
    
    except Exception as e:
        print(f"Error querying users: {e}")

if __name__ == "__main__":
    test_database_columns()
