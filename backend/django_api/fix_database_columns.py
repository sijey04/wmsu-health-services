import os
import sys
import django

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_and_fix_database():
    """Check if academic_year_id column exists and add it if missing"""
    
    with connection.cursor() as cursor:
        try:
            # Check if the column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            if not column_exists:
                print("Column 'academic_year_id' does not exist. Adding it...")
                
                # Add the column
                cursor.execute("""
                    ALTER TABLE api_medicaldocument 
                    ADD COLUMN academic_year_id INTEGER NULL
                """)
                
                # Add the foreign key constraint
                cursor.execute("""
                    ALTER TABLE api_medicaldocument 
                    ADD CONSTRAINT api_medicaldocument_academic_year_id_fk 
                    FOREIGN KEY (academic_year_id) 
                    REFERENCES api_academicschoolyear(id)
                """)
                
                print("Column 'academic_year_id' added successfully!")
                
            else:
                print("Column 'academic_year_id' already exists.")
                
        except Exception as e:
            print(f"Error checking/fixing database: {e}")
            
            # Try MySQL syntax instead
            try:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE()
                    AND table_name = 'api_medicaldocument' 
                    AND column_name = 'academic_year_id'
                """)
                column_exists = cursor.fetchone()[0] > 0
                
                if not column_exists:
                    print("Column 'academic_year_id' does not exist (MySQL). Adding it...")
                    
                    # Add the column
                    cursor.execute("""
                        ALTER TABLE api_medicaldocument 
                        ADD COLUMN academic_year_id INTEGER NULL
                    """)
                    
                    # Add the foreign key constraint
                    cursor.execute("""
                        ALTER TABLE api_medicaldocument 
                        ADD CONSTRAINT api_medicaldocument_academic_year_id_fk 
                        FOREIGN KEY (academic_year_id) 
                        REFERENCES api_academicschoolyear(id)
                    """)
                    
                    print("Column 'academic_year_id' added successfully (MySQL)!")
                    
                else:
                    print("Column 'academic_year_id' already exists (MySQL).")
                    
            except Exception as e2:
                print(f"Error with MySQL syntax: {e2}")
    
    # Also check if we need to create unique constraint
    with connection.cursor() as cursor:
        try:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_name = 'api_medicaldocument' 
                AND constraint_name = 'unique_medical_document_per_patient_year'
            """)
            constraint_exists = cursor.fetchone()[0] > 0
            
            if not constraint_exists:
                print("Adding unique constraint...")
                cursor.execute("""
                    ALTER TABLE api_medicaldocument 
                    ADD CONSTRAINT unique_medical_document_per_patient_year 
                    UNIQUE (patient_id, academic_year_id)
                """)
                print("Unique constraint added successfully!")
            else:
                print("Unique constraint already exists.")
                
        except Exception as e:
            print(f"Error with unique constraint: {e}")

if __name__ == "__main__":
    check_and_fix_database()
