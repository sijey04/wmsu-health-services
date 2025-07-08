import os
import sys
import django
import datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.academic_year_models import AcademicYear

def setup_academic_years():
    """Create initial academic years"""
    print("Setting up academic years...")
    
    # Check if academic years already exist
    if AcademicYear.objects.exists():
        print("Academic years already exist. Skipping setup.")
        return
    
    # Create two initial academic years
    current_year = datetime.datetime.now().year
    
    # Current academic year
    AcademicYear.objects.create(
        academic_year=f"{current_year}-{current_year + 1}",
        start_date=datetime.date(current_year, 6, 15),  # June 15
        end_date=datetime.date(current_year + 1, 3, 15),  # March 15
        is_current=True,
        status='active'
    )
    
    # Next academic year
    AcademicYear.objects.create(
        academic_year=f"{current_year + 1}-{current_year + 2}",
        start_date=datetime.date(current_year + 1, 6, 15),  # June 15
        end_date=datetime.date(current_year + 2, 3, 15),  # March 15
        is_current=False,
        status='upcoming'
    )
    
    print("Academic years created successfully.")

if __name__ == "__main__":
    setup_academic_years()
