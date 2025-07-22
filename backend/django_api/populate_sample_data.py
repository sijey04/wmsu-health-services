#!/usr/bin/env python3
"""
Sample Data Population Script for WMSU Health Services
This script populates the database with realistic sample data for testing dashboard, charts, and export functionality.
"""

import os
import sys
import django
from datetime import datetime, date, timedelta
import random
from decimal import Decimal
from django.utils import timezone

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import *
from django.contrib.auth.hashers import make_password
import uuid

class SampleDataPopulator:
    def __init__(self):
        self.current_year = 2024
        self.current_school_year = None
        self.campuses = ['a', 'b', 'c']
        self.colleges = [
            'College of Engineering', 'College of Medicine', 'College of Nursing',
            'College of Education', 'College of Computer Studies', 'College of Business Administration',
            'College of Liberal Arts', 'College of Science and Mathematics'
        ]
        self.courses = [
            'Computer Science', 'Information Technology', 'Engineering', 'Nursing',
            'Education', 'Business Administration', 'Psychology', 'Biology', 'Mathematics'
        ]
        self.year_levels = ['1st Year', '2nd Year', '3rd Year', '4th Year']
        self.sample_users = []
        self.sample_patients = []
        
    def get_current_school_year(self):
        """Get the current active school year"""
        try:
            return AcademicSchoolYear.objects.get(is_current=True)
        except AcademicSchoolYear.DoesNotExist:
            # Create current school year if it doesn't exist
            school_year = AcademicSchoolYear.objects.create(
                academic_year='2024-2025',
                start_date=date(2024, 8, 15),
                end_date=date(2025, 7, 31),
                is_current=True,
                status='active',
                first_sem_start=date(2024, 8, 15),
                first_sem_end=date(2024, 12, 20),
                second_sem_start=date(2025, 1, 15),
                second_sem_end=date(2025, 5, 31),
                summer_start=date(2025, 6, 1),
                summer_end=date(2025, 7, 31)
            )
            print(f"Created current school year: {school_year.academic_year}")
            return school_year

    def create_sample_users(self, count=30):
        """Create diverse sample users (students, staff, doctors)"""
        print(f"Creating {count} sample users...")
        
        user_types = ['student', 'doctor', 'staff']
        user_weights = [0.7, 0.15, 0.15]  # 70% students, 15% doctors, 15% staff
        
        first_names = [
            'Maria', 'Jose', 'Juan', 'Ana', 'Carlos', 'Elena', 'Miguel', 'Sofia', 'Luis', 'Carmen',
            'Pedro', 'Isabel', 'Antonio', 'Luz', 'Francisco', 'Rosa', 'Manuel', 'Teresa', 'Fernando', 'Patricia',
            'Ricardo', 'Gloria', 'Alberto', 'Esperanza', 'Roberto', 'Dolores', 'Joaquin', 'Pilar', 'Rafael', 'Concepcion'
        ]
        
        last_names = [
            'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
            'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos',
            'Santos', 'Mendoza', 'Castillo', 'Jimenez', 'Romero', 'Aguilar', 'Delgado', 'Herrera', 'Vargas', 'Castro'
        ]
        
        grade_levels = [
            'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
            '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'Employee'
        ]
        
        created_users = []
        
        for i in range(count):
            user_type = random.choices(user_types, weights=user_weights)[0]
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            middle_initial = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
            
            # Generate email
            email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@wmsu.edu.ph"
            
            # Create user
            user = CustomUser.objects.create(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_initial,
                password=make_password('password123'),
                user_type=user_type,
                is_email_verified=True,
                email_verification_token=str(uuid.uuid4()),
                grade_level=random.choice(grade_levels) if user_type == 'student' else 'Employee',
                is_staff=user_type in ['doctor', 'staff'],
                is_active=True,
                date_joined=timezone.now() - timedelta(days=random.randint(1, 365))
            )
            
            created_users.append(user)
            
        self.sample_users = created_users
        print(f"Created {len(created_users)} sample users")
        return created_users

    def create_sample_patients(self):
        """Create patient profiles for the sample users"""
        print("Creating sample patient profiles...")
        
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        civil_statuses = ['single', 'married', 'divorced', 'widowed']
        religions = ['Catholic', 'Protestant', 'Islam', 'Buddhist', 'Other']
        
        # Get some comorbid illnesses for random assignment
        comorbid_illnesses = list(ComorbidIllness.objects.filter(is_enabled=True)[:10])
        
        barangays = [
            'Tetuan', 'Tugbungan', 'Recodo', 'Tumaga', 'Putik', 'Manicahan', 'Guiwan', 
            'San Roque', 'Santa Maria', 'La Paz', 'Divisoria', 'Pasonanca', 'Mercedes'
        ]
        
        created_patients = []
        school_year = self.get_current_school_year()
        
        for user in self.sample_users:
            if user.user_type == 'student':
                # Generate realistic age based on grade level
                if 'Grade' in user.grade_level:
                    age = random.randint(12, 18)
                elif 'Year' in user.grade_level:
                    year_num = int(user.grade_level.split()[0][0])
                    age = 17 + year_num + random.randint(0, 2)
                else:
                    age = random.randint(18, 25)
                
                birth_date = date.today() - timedelta(days=age * 365 + random.randint(0, 365))
                
                # Create patient profile
                patient = Patient.objects.create(
                    user=user,
                    student_id=f"SAMPLE-{user.id}",
                    name=f"{user.last_name}, {user.first_name}",
                    first_name=user.first_name,
                    surname=user.last_name,
                    middle_name=user.middle_name,
                    sex=random.choice(['Male', 'Female']),
                    birthday=birth_date,
                    age=age,
                    blood_type=random.choice(blood_types),
                    civil_status=random.choice(civil_statuses),
                    religion=random.choice(religions),
                    course=random.choice(self.courses),
                    year_level=user.grade_level,
                    department=random.choice(self.colleges),
                    contact_number=f"09{random.randint(100000000, 999999999)}",
                    email=user.email,
                    barangay=random.choice(barangays),
                    city_municipality='Zamboanga City',
                    street=f"{random.randint(1, 999)} {random.choice(['Main St', 'Central Ave', 'University Rd', 'Campus Dr'])}",
                    emergency_contact_name=f"{random.choice(['Maria', 'Jose', 'Ana', 'Carlos'])} {user.last_name}",
                    emergency_contact_number=f"09{random.randint(100000000, 999999999)}",
                    emergency_contact_relationship=random.choice(['Mother', 'Father', 'Guardian', 'Sibling']),
                    school_year=school_year,
                    semester=random.choice(['1st_semester', '2nd_semester', 'summer']),
                    uhs_template_compliant=True,
                    record_completion_status='complete',
                    hospital_admission_or_surgery=random.choice([True, False]),
                    menstruation_regular=random.choice([True, False]) if random.random() < 0.5 else False,
                    menstruation_irregular=False,
                    covid19_vaccination_status=random.choice(['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'])
                )
                
                # Randomly assign some comorbid illnesses
                if comorbid_illnesses and random.random() < 0.3:  # 30% chance of having comorbid illness
                    selected_illnesses = random.sample(comorbid_illnesses, random.randint(1, 2))
                    patient.comorbid_illnesses = [illness.label for illness in selected_illnesses]
                    patient.save()
                
                created_patients.append(patient)
        
        self.sample_patients = created_patients
        print(f"Created {len(created_patients)} sample patient profiles")
        return created_patients

    def create_sample_appointments(self, count=50):
        """Create sample appointments with various statuses and types"""
        print(f"Creating {count} sample appointments...")
        
        if not self.sample_patients:
            print("No patients available. Creating patients first...")
            self.create_sample_patients()
        
        appointment_types = ['medical', 'dental']
        statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled']
        status_weights = [0.2, 0.15, 0.4, 0.15, 0.1]  # More completed appointments for testing
        
        purposes = [
            'General Check-up', 'Medical Consultation', 'Dental Examination', 'Follow-up Visit',
            'Health Certificate', 'Physical Examination', 'Dental Cleaning', 'Emergency Consultation',
            'Vaccination', 'Laboratory Results', 'Prescription Renewal', 'Health Screening'
        ]
        
        school_year = self.get_current_school_year()
        created_appointments = []
        
        # Create appointments spread across the academic year
        start_date = school_year.start_date
        end_date = min(date.today(), school_year.end_date)
        date_range = (end_date - start_date).days
        
        for i in range(count):
            patient = random.choice(self.sample_patients)
            appointment_type = random.choice(appointment_types)
            status = random.choices(statuses, weights=status_weights)[0]
            
            # Generate appointment date within the academic year
            days_offset = random.randint(0, date_range)
            appointment_date = start_date + timedelta(days=days_offset)
            
            # Generate appointment time during business hours
            hour = random.randint(8, 16)
            minute = random.choice([0, 30])
            appointment_time = f"{hour:02d}:{minute:02d}:00"
            
            # Determine semester based on appointment date
            if school_year.first_sem_start <= appointment_date <= school_year.first_sem_end:
                semester = '1st_semester'
            elif school_year.second_sem_start <= appointment_date <= school_year.second_sem_end:
                semester = '2nd_semester'
            else:
                semester = 'summer'
            
            appointment = Appointment.objects.create(
                patient=patient,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                purpose=random.choice(purposes),
                type=appointment_type,
                status=status,
                campus=random.choice(self.campuses),
                school_year=school_year,
                semester=semester,
                concern=random.choice([
                    'Routine health check', 'Follow-up consultation', 'Health certificate needed',
                    'Feeling unwell', 'Dental pain', 'Regular cleaning', 'Medical clearance'
                ]) if random.random() < 0.7 else '',
                notes=f"Appointment #{i+1} - {status}" if status == 'completed' else None,
                created_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                updated_at=timezone.now()
            )
            
            created_appointments.append(appointment)
        
        print(f"Created {len(created_appointments)} sample appointments")
        return created_appointments

    def create_sample_medical_forms(self, count=25):
        """Create sample medical form data for completed appointments"""
        print(f"Creating {count} sample medical forms...")
        
        # Get completed medical appointments
        completed_medical_appointments = Appointment.objects.filter(
            type='medical',
            status='completed'
        )[:count]
        
        if not completed_medical_appointments:
            print("No completed medical appointments found.")
            return []
        
        diagnoses = [
            'Upper Respiratory Tract Infection', 'Headache', 'Gastritis', 'Hypertension',
            'Common Cold', 'Allergic Rhinitis', 'Fever', 'Stomach Ache', 'Migraine',
            'Anxiety', 'Back Pain', 'Skin Allergy', 'Cough', 'Dizziness'
        ]
        
        treatments = [
            'Rest and medication', 'Antibiotic therapy', 'Pain management', 'Lifestyle modification',
            'Follow-up in 1 week', 'Prescription medication', 'Home remedies', 'Referral to specialist'
        ]
        
        created_forms = []
        school_year = self.get_current_school_year()
        
        for appointment in completed_medical_appointments:
            medical_form = MedicalFormData.objects.create(
                patient=appointment.patient,
                appointment=appointment,
                academic_year=school_year,
                file_no=f"MED-{appointment.patient.student_id}",
                surname=appointment.patient.surname or appointment.patient.name.split(',')[0] if ',' in appointment.patient.name else appointment.patient.last_name,
                first_name=appointment.patient.first_name,
                middle_name=appointment.patient.middle_name,
                age=appointment.patient.age,
                sex=appointment.patient.sex or 'Male',
                date=appointment.appointment_date,
                blood_pressure=f"{random.randint(90, 140)}/{random.randint(60, 90)}",
                pulse_rate=str(random.randint(60, 100)),
                temperature=str(round(random.uniform(36.0, 37.5), 1)),
                respiratory_rate=str(random.randint(12, 20)),
                weight=str(random.randint(40, 90)),
                height=str(random.randint(150, 180)),
                chief_complaint=random.choice([
                    'Headache', 'Fever', 'Cough', 'Stomach pain', 'Fatigue', 'Dizziness'
                ]),
                diagnosis=random.choice(diagnoses),
                treatment_plan=random.choice(treatments),
                examined_by=f"Dr. {random.choice(['Smith', 'Johnson', 'Garcia', 'Brown', 'Davis'])}",
                created_at=appointment.created_at,
                updated_at=appointment.updated_at
            )
            
            created_forms.append(medical_form)
        
        print(f"Created {len(created_forms)} sample medical forms")
        return created_forms

    def create_sample_dental_forms(self, count=15):
        """Create sample dental form data for completed dental appointments"""
        print(f"Creating {count} sample dental forms...")
        
        # Get completed dental appointments
        completed_dental_appointments = Appointment.objects.filter(
            type='dental',
            status='completed'
        )[:count]
        
        if not completed_dental_appointments:
            print("No completed dental appointments found.")
            return []
        
        dental_conditions = ['Normal', 'Gingivitis', 'Caries', 'Plaque buildup']
        dental_treatments = ['Cleaning', 'Filling', 'Extraction', 'Fluoride treatment']
        
        created_forms = []
        school_year = self.get_current_school_year()
        
        for appointment in completed_dental_appointments:
            dental_form = DentalFormData.objects.create(
                patient=appointment.patient,
                appointment=appointment,
                academic_year=school_year,
                file_no=f"DENTAL-{appointment.patient.student_id}",
                surname=appointment.patient.surname or appointment.patient.name.split(',')[0] if ',' in appointment.patient.name else 'Unknown',
                first_name=appointment.patient.first_name,
                middle_name=appointment.patient.middle_name,
                age=appointment.patient.age,
                sex=appointment.patient.sex or 'Male',
                date=appointment.appointment_date,
                has_toothbrush=random.choice(['Yes', 'No']),
                dentition=random.choice(['Primary', 'Mixed', 'Permanent']),
                periodontal=random.choice(dental_conditions),
                occlusion=random.choice(['Normal', 'Class I', 'Class II', 'Class III']),
                examined_by=f"Dr. {random.choice(['Wilson', 'Martinez', 'Anderson', 'Taylor'])}",
                oral_hygiene=random.choice(['Good', 'Fair', 'Poor']),
                decayed_teeth=str(random.randint(0, 5)),
                filled_teeth=str(random.randint(0, 3)),
                missing_teeth=str(random.randint(0, 2)),
                recommended_treatments=random.choice(dental_treatments),
                created_at=appointment.created_at,
                updated_at=appointment.updated_at,
                total_consultations=1,
                consultation_template_compliant=True
            )
            
            created_forms.append(dental_form)
        
        print(f"Created {len(created_forms)} sample dental forms")
        return created_forms

    def create_sample_medical_documents(self, count=20):
        """Create sample medical documents/certificates"""
        print(f"Creating {count} sample medical documents...")
        
        document_types = [
            'health_certificate', 'medical_clearance', 'fitness_certificate',
            'vaccination_record', 'laboratory_result', 'medical_report'
        ]
        
        document_names = {
            'health_certificate': 'Health Certificate',
            'medical_clearance': 'Medical Clearance',
            'fitness_certificate': 'Physical Fitness Certificate',
            'vaccination_record': 'Vaccination Record',
            'laboratory_result': 'Laboratory Result',
            'medical_report': 'Medical Report'
        }
        
        created_documents = []
        
        for i in range(count):
            patient = random.choice(self.sample_patients)
            doc_type = random.choice(document_types)
            
            document = MedicalDocument.objects.create(
                patient=patient,
                document_type=doc_type,
                document_name=document_names[doc_type],
                purpose=random.choice([
                    'Employment requirement', 'School enrollment', 'Sports participation',
                    'Travel requirement', 'Insurance claim', 'General health record'
                ]),
                issued_date=date.today() - timedelta(days=random.randint(1, 90)),
                expiry_date=date.today() + timedelta(days=random.randint(30, 365)),
                issued_by=f"Dr. {random.choice(['Rodriguez', 'Silva', 'Mendez', 'Cruz'])}",
                is_active=True,
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
            
            created_documents.append(document)
        
        print(f"Created {len(created_documents)} sample medical documents")
        return created_documents

    def run_all(self):
        """Run all sample data creation steps"""
        print("Starting sample data population...")
        print("=" * 50)
        
        try:
            # Step 1: Create users
            self.create_sample_users(30)
            
            # Step 2: Create patient profiles
            self.create_sample_patients()
            
            # Step 3: Create appointments
            self.create_sample_appointments(50)
            
            # Step 4: Create medical forms
            self.create_sample_medical_forms(25)
            
            # Step 5: Create dental forms
            self.create_sample_dental_forms(15)
            
            # Step 6: Create medical documents
            self.create_sample_medical_documents(20)
            
            print("=" * 50)
            print("Sample data population completed successfully!")
            
            # Print summary
            print("\nSummary:")
            print(f"- Users created: {CustomUser.objects.filter(username__contains='@wmsu.edu.ph').count()}")
            print(f"- Patients created: {Patient.objects.count()}")
            print(f"- Appointments created: {Appointment.objects.count()}")
            print(f"- Medical forms created: {MedicalFormData.objects.count()}")
            print(f"- Dental forms created: {DentalFormData.objects.count()}")
            print(f"- Medical documents created: {MedicalDocument.objects.count()}")
            
        except Exception as e:
            print(f"Error during sample data creation: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    populator = SampleDataPopulator()
    populator.run_all()
