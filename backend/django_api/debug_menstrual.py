#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.db import connection
from api.models import Patient

def check_menstrual_symptoms_constraint():
    """Check the database constraint for menstrual_symptoms field"""
    with connection.cursor() as cursor:
        # Get table information
        cursor.execute("SHOW CREATE TABLE api_patient")
        result = cursor.fetchone()
        print("Table definition:")
        print(result[1])
        
        # Check for constraints specifically on menstrual_symptoms
        cursor.execute("""
            SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
            FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
            WHERE TABLE_NAME = 'api_patient' 
            AND TABLE_SCHEMA = DATABASE()
        """)
        constraints = cursor.fetchall()
        print("\nCheck constraints:")
        for constraint in constraints:
            print(f"Constraint: {constraint[0]}, Clause: {constraint[1]}")

if __name__ == "__main__":
    check_menstrual_symptoms_constraint()
