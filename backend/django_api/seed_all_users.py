import os
import django
import sys
import uuid
from datetime import date, datetime, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, Patient, AcademicSchoolYear
from django.contrib.auth.hashers import make_password

def seed_users():
    print("Starting database seeding...")

    # 1. Ensure current school year exists
    school_year, _ = AcademicSchoolYear.objects.get_or_create(
        academic_year="2025-2026",
        semester_type="1st",
        defaults={
            "start_date": date(2025, 8, 1),
            "end_date": date(2026, 5, 31),
            "is_current": True,
            "status": "active"
        }
    )
    if not school_year.is_current:
        school_year.is_current = True
        school_year.save()

    # 2. Define user types
    user_types = [
        {"name": "Kindergarten", "type": "student", "email": "kinder@test.com"},
        {"name": "Elementary", "type": "student", "email": "elementary@test.com"},
        {"name": "High School", "type": "student", "email": "highschool@test.com"},
        {"name": "Senior High School", "type": "student", "email": "shs@test.com"},
        {"name": "College", "type": "student", "email": "college@test.com"},
        {"name": "Employee", "type": "staff", "email": "employee@test.com"},
        {"name": "Incoming Freshman", "type": "student", "email": "freshman@test.com"},
    ]

    password = "Password123!"
    hashed_password = make_password(password)

    print("\nCreating users and profiles...")
    
    # Create Super Admin if not exists
    admin, created = CustomUser.objects.get_or_create(
        email="admin@test.com",
        defaults={
            "username": "admin@test.com",
            "password": hashed_password,
            "first_name": "System",
            "last_name": "Administrator",
            "user_type": "admin",
            "is_staff": True,
            "is_superuser": True,
            "is_email_verified": True
        }
    )
    if created:
        print(f"Created Super Admin: admin@test.com / {password}")

    # Create Staff user if not exists
    staff_user, created = CustomUser.objects.get_or_create(
        email="staff@test.com",
        defaults={
            "username": "staff@test.com",
            "password": hashed_password,
            "first_name": "Medical",
            "last_name": "Staff",
            "user_type": "staff",
            "is_staff": True,
            "is_email_verified": True
        }
    )
    if created:
        print(f"Created Staff: staff@test.com / {password}")

    # Create each user type
    for ut in user_types:
        user, created = CustomUser.objects.get_or_create(
            email=ut["email"],
            defaults={
                "username": ut["email"],
                "password": hashed_password,
                "first_name": ut["name"].split()[0],
                "last_name": "User",
                "user_type": ut["type"],
                "grade_level": ut["name"],
                "is_email_verified": True
            }
        )
        
        if created:
            print(f"Created User: {ut['email']} ({ut['name']}) / {password}")
            
            # Create Patient Profile
            patient, p_created = Patient.objects.get_or_create(
                user=user,
                school_year=school_year,
                semester="1st_semester",
                defaults={
                    "student_id": f"ID-{user.id:04d}",
                    "name": f"User, {ut['name']}",
                    "first_name": ut["name"],
                    "surname": "User",
                    "gender": "Male" if ut["name"] != "Kindergarten" else "Female",
                    "date_of_birth": date(2000, 1, 1),
                    "age": 25,
                    "email": ut["email"],
                    "contact_number": "09123456789",
                    "address": "WMSU Campus, Zamboanga City",
                    "city_municipality": "Zamboanga City",
                    "barangay": "Baliwasan",
                    "street": "Normal Road",
                    "blood_type": "O+",
                    "religion": "Roman Catholic",
                    "nationality": "Filipino",
                    "civil_status": "single",
                    "user_type": ut["name"],
                    "record_completion_status": "completed",
                    "emergency_contact_name": "Emergency Contact",
                    "emergency_contact_number": "09987654321",
                    "emergency_contact_relationship": "Parent",
                    "comorbid_illnesses": ["None"],
                    "maintenance_medications": ["None"],
                    "vaccination_history": {"COVID-19": "Fully Vaccinated"},
                    "past_medical_history": ["None"],
                    "family_medical_history": ["None"]
                }
            )
            if p_created:
                print(f"  - Completed patient profile for {ut['name']}")

    print("\nSeeding completed successfully!")

if __name__ == "__main__":
    seed_users()
