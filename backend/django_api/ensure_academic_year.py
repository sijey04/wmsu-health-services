#!/usr/bin/env python
"""
Script to ensure there's a current academic year
"""
import os
import django
import sys
from datetime import date

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import AcademicSchoolYear


def ensure_current_academic_year():
    """Ensure there's a current academic year"""
    current_year = AcademicSchoolYear.objects.filter(is_current=True).first()
    
    if not current_year:
        # Create a default current academic year
        current_date = date.today()
        if current_date.month >= 8:  # August onwards is new academic year
            academic_year = f"{current_date.year}-{current_date.year + 1}"
            start_date = date(current_date.year, 8, 1)
            end_date = date(current_date.year + 1, 7, 31)
        else:  # January to July is previous academic year
            academic_year = f"{current_date.year - 1}-{current_date.year}"
            start_date = date(current_date.year - 1, 8, 1)
            end_date = date(current_date.year, 7, 31)
        
        current_year = AcademicSchoolYear.objects.create(
            academic_year=academic_year,
            start_date=start_date,
            end_date=end_date,
            is_current=True,
            status='active'
        )
        
        print(f"Created current academic year: {academic_year}")
    else:
        print(f"Current academic year already exists: {current_year.academic_year}")


if __name__ == '__main__':
    ensure_current_academic_year()
