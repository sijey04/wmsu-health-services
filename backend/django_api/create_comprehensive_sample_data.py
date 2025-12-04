#!/usr/bin/env python
"""
Comprehensive Sample Data Creator for WMSU Health Services
Creates realistic sample data across all service types for testing PDF exports
"""
import os
import sys
import django
from datetime import datetime, date, timedelta, time
import random
from django.utils import timezone

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import (
    CustomUser, Patient, AcademicSchoolYear, MedicalRecord, Appointment,
    MedicalDocument, StaffDetails, DentalFormData
)

class ComprehensiveSampleDataCreator:
    def __init__(self):
        self.current_year = datetime.now().year
        self.education_levels = [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
            'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
            'Undergraduate', 'Postgraduate', 'Doctoral', 'Faculty', 'Staff', 'Employee'
        ]
        self.departments = [
            'Computer Science', 'Nursing', 'Education', 'Engineering', 'Business Administration',
            'Psychology', 'Biology', 'Mathematics', 'English', 'History', 'Chemistry',
            'Physics', 'Architecture', 'Medicine', 'Dentistry', 'Pharmacy'
        ]
        self.first_names = [
            'Juan', 'Maria', 'Jose', 'Anna', 'Pedro', 'Carmen', 'Antonio', 'Rosa',
            'Manuel', 'Isabel', 'Francisco', 'Teresa', 'Rafael', 'Patricia', 'Miguel',
            'Gloria', 'Alejandro', 'Esperanza', 'Ricardo', 'Mercedes', 'Carlos', 'Dolores',
            'Fernando', 'Pilar', 'Diego', 'Concepcion', 'Jorge', 'Josefa', 'Ramon',
            'Francisca', 'Luis', 'Antonia', 'Angel', 'Rosario', 'Joaquin', 'Juana'
        ]
        self.last_names = [
            'Santos', 'Reyes', 'Cruz', 'Garcia', 'Rodriguez', 'Gonzalez', 'Hernandez',
            'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores',
            'Rivera', 'Gomez', 'Diaz', 'Morales', 'Jimenez', 'Alvarez', 'Ruiz',
            'Castillo', 'Vargas', 'Ramos', 'Castro', 'Ortega', 'Delgado', 'Aguilar'
        ]
        
    def run(self):
        """Execute the complete sample data creation process"""
        print("🏥 Creating comprehensive sample data for WMSU Health Services...")
        
        # 1. Create Academic Year
        school_year = self.create_academic_year()
        print(f"✅ Created academic year: {school_year}")
        
        # 2. Create Staff Users
        staff_users = self.create_staff_users()
        print(f"✅ Created {len(staff_users)} staff users")
        
        # 3. Create Student/Employee Users with Patient Profiles
        patients = self.create_patients_with_users(school_year, 150)
        print(f"✅ Created {len(patients)} patients with user accounts")
        
        # 4. Create Medical Records and Consultations
        medical_records = self.create_medical_records(patients, staff_users)
        print(f"✅ Created {len(medical_records)} medical records")
        
        # 5. Create Dental Consultations
        dental_records = self.create_dental_consultations(patients, staff_users, school_year)
        print(f"✅ Created {len(dental_records)} dental consultation records")
        
        # 6. Create Medical Documents (Certificate Requests)
        medical_docs = self.create_medical_documents(patients, school_year)
        print(f"✅ Created {len(medical_docs)} medical document submissions")
        
        # 7. Create Appointments
        appointments = self.create_appointments(patients, staff_users, school_year)
        print(f"✅ Created {len(appointments)} appointments")
        
        print("\n🎉 Comprehensive sample data creation completed!")
        print("📊 Database now contains realistic data for testing all PDF export features:")
        print(f"   - Users: {CustomUser.objects.count()}")
        print(f"   - Patient Profiles: {Patient.objects.count()}")
        print(f"   - Medical Records: {MedicalRecord.objects.count()}")
        print(f"   - Dental Consultations: {DentalFormData.objects.count()}")
        print(f"   - Medical Documents: {MedicalDocument.objects.count()}")
        print(f"   - Appointments: {Appointment.objects.count()}")
        
    def create_academic_year(self):
        """Create the current academic year with proper semester dates"""
        year_str = f"{self.current_year}-{self.current_year + 1}"
        
        school_year, created = AcademicSchoolYear.objects.get_or_create(
            year=year_str,
            defaults={
                'start_date': date(self.current_year, 8, 15),
                'end_date': date(self.current_year + 1, 5, 31),
                'first_sem_start': date(self.current_year, 8, 15),
                'first_sem_end': date(self.current_year, 12, 20),
                'second_sem_start': date(self.current_year + 1, 1, 15),
                'second_sem_end': date(self.current_year + 1, 5, 31),
                'summer_start': date(self.current_year + 1, 6, 1),
                'summer_end': date(self.current_year + 1, 7, 31),
                'is_active': True
            }
        )
        return school_year
        
    def create_staff_users(self):
        """Create staff users with different roles"""
        staff_data = [
            {
                'username': 'dr.santos', 'email': 'dr.santos@wmsu.edu.ph',
                'first_name': 'Maria', 'last_name': 'Santos',
                'user_type': 'doctor', 'full_name': 'Dr. Maria Santos, M.D.',
                'position': 'University Physician', 'license': 'MD-12345'
            },
            {
                'username': 'dr.cruz', 'email': 'dr.cruz@wmsu.edu.ph',
                'first_name': 'Juan', 'last_name': 'Cruz',
                'user_type': 'doctor', 'full_name': 'Dr. Juan Cruz, D.M.D.',
                'position': 'University Dentist', 'license': 'DMD-67890'
            },
            {
                'username': 'nurse.garcia', 'email': 'nurse.garcia@wmsu.edu.ph',
                'first_name': 'Rosa', 'last_name': 'Garcia',
                'user_type': 'nurse', 'full_name': 'Rosa Garcia, R.N.',
                'position': 'Head Nurse', 'license': 'RN-11111'
            },
            {
                'username': 'admin.reyes', 'email': 'admin.reyes@wmsu.edu.ph',
                'first_name': 'Carlos', 'last_name': 'Reyes',
                'user_type': 'admin', 'full_name': 'Carlos Reyes',
                'position': 'Health Services Administrator', 'license': None
            }
        ]
        
        staff_users = []
        for data in staff_data:
            user, created = CustomUser.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'user_type': data['user_type'],
                    'is_staff': True,
                    'is_active': True,
                    'email_verified': True
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                
                # Create staff details
                StaffDetails.objects.get_or_create(
                    user=user,
                    defaults={
                        'full_name': data['full_name'],
                        'position': data['position'],
                        'license_number': data['license'],
                        'campus_assigned': 'a',
                        'assigned_campuses': 'a,b,c'
                    }
                )
                
            staff_users.append(user)
            
        return staff_users
        
    def create_patients_with_users(self, school_year, count=150):
        """Create patient profiles with corresponding user accounts"""
        patients = []
        semesters = ['1st_semester', '2nd_semester', 'summer']
        
        for i in range(count):
            # Create user account first
            education_level = random.choice(self.education_levels)
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            
            # Generate student ID based on education level
            if education_level in ['Faculty', 'Staff', 'Employee']:
                student_id = f"EMP-{2000 + i:04d}"
                username = f"emp{2000 + i:04d}"
            else:
                student_id = f"{self.current_year}-{i + 1:04d}"
                username = f"student{i + 1:04d}"
                
            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{username}@wmsu.edu.ph",
                    'first_name': first_name,
                    'last_name': last_name,
                    'user_type': 'faculty' if education_level in ['Faculty'] else 'employee' if education_level in ['Staff', 'Employee'] else 'student',
                    'education_level': education_level,
                    'is_active': True,
                    'email_verified': True
                }
            )
            
            if created:
                user.set_password('password123')
                user.save()
            
            # Create patient profile
            birth_year = self.current_year - random.randint(16, 65)
            age = self.current_year - birth_year
            
            patient, created = Patient.objects.get_or_create(
                student_id=student_id,
                defaults={
                    'user': user,
                    'name': f"{last_name}, {first_name}",
                    'first_name': first_name,
                    'middle_name': random.choice(['A', 'B', 'C', 'D', 'E']) + '.',
                    'gender': random.choice(['Male', 'Female']),
                    'date_of_birth': date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                    'age': age,
                    'department': random.choice(self.departments),
                    'contact_number': f"09{random.randint(100000000, 999999999)}",
                    'email': f"{username}@wmsu.edu.ph",
                    'address': f"{random.randint(1, 999)} {random.choice(['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr'])}",
                    'city_municipality': random.choice(['Zamboanga City', 'Isabela', 'Tumaga', 'Tetuan']),
                    'barangay': f"Brgy. {random.choice(['San Jose', 'Santa Maria', 'San Pedro', 'Poblacion'])}",
                    'blood_type': random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
                    'religion': random.choice(['Roman Catholic', 'Islam', 'Protestant', 'Iglesia ni Cristo']),
                    'nationality': 'Filipino',
                    'civil_status': random.choice(['single', 'married', 'widowed']),
                    'school_year': school_year,
                    'semester': random.choice(semesters),
                    # Emergency contact
                    'emergency_contact_surname': random.choice(self.last_names),
                    'emergency_contact_first_name': random.choice(self.first_names),
                    'emergency_contact_number': f"09{random.randint(100000000, 999999999)}",
                    'emergency_contact_relationship': random.choice(['Parent', 'Spouse', 'Sibling', 'Guardian']),
                    # Health data
                    'comorbid_illnesses': random.choices(['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease'], k=random.randint(0, 2)),
                    'vaccination_history': {
                        'covid19': random.choice(['fully_vaccinated', 'boosted', 'partially_vaccinated']),
                        'flu': random.choice([True, False]),
                        'hepatitis_b': random.choice([True, False])
                    }
                }
            )
            
            patients.append(patient)
            
        return patients
        
    def create_medical_records(self, patients, staff_users):
        """Create medical consultation records"""
        medical_records = []
        doctors = [user for user in staff_users if user.user_type == 'doctor' and 'M.D.' in getattr(user.staff_details, 'full_name', '')]
        
        # Medical conditions and treatments
        conditions = [
            'Upper Respiratory Tract Infection', 'Headache', 'Fever', 'Cough and Colds',
            'Stomach Pain', 'Allergic Reaction', 'Minor Injury', 'Hypertension',
            'Migraine', 'Back Pain', 'Skin Irritation', 'Dizziness'
        ]
        
        treatments = [
            'Rest and hydration', 'Prescribed pain medication', 'Antibiotic therapy',
            'Allergy medication', 'Physical therapy exercises', 'Dietary changes',
            'Wound cleaning and dressing', 'Blood pressure monitoring'
        ]
        
        # Create 2-5 records per patient over the past 6 months
        for patient in patients[:100]:  # Create records for first 100 patients
            num_records = random.randint(1, 4)
            for _ in range(num_records):
                record_date = timezone.now() - timedelta(days=random.randint(1, 180))
                doctor = random.choice(doctors) if doctors else None
                condition = random.choice(conditions)
                treatment = random.choice(treatments)
                
                record = MedicalRecord.objects.create(
                    patient=patient,
                    record_date=record_date,
                    doctor=doctor,
                    diagnosis=condition,
                    treatment=treatment,
                    prescription=f"Prescribed medication for {condition.lower()}" if random.choice([True, False]) else "",
                    notes=f"Patient responded well to treatment. Follow-up recommended." if random.choice([True, False]) else "",
                    school_year=patient.school_year
                )
                medical_records.append(record)
                
        return medical_records
        
    def create_dental_consultations(self, patients, staff_users, school_year):
        """Create dental consultation records"""
        dental_records = []
        dentists = [user for user in staff_users if user.user_type == 'doctor' and 'D.M.D.' in getattr(user.staff_details, 'full_name', '')]
        
        dental_conditions = [
            'Tooth Decay', 'Gingivitis', 'Tooth Cleaning', 'Tooth Extraction',
            'Dental Filling', 'Root Canal', 'Orthodontic Consultation', 'Periodontal Disease'
        ]
        
        dental_treatments = [
            'Dental prophylaxis', 'Composite filling', 'Tooth extraction', 'Root canal therapy',
            'Scaling and polishing', 'Fluoride treatment', 'Dental sealants', 'Oral health education'
        ]
        
        # Create dental records for random patients
        for patient in random.sample(patients, 80):  # 80 patients with dental visits
            num_visits = random.randint(1, 3)
            for _ in range(num_visits):
                visit_date = timezone.now() - timedelta(days=random.randint(1, 180))
                dentist = random.choice(dentists) if dentists else None
                condition = random.choice(dental_conditions)
                treatment = random.choice(dental_treatments)
                
                # Create dental form data
                dental_data = DentalFormData.objects.create(
                    patient=patient,
                    doctor=dentist,
                    consultation_date=visit_date.date(),
                    chief_complaint=condition,
                    treatment_rendered=treatment,
                    school_year=school_year,
                    semester=patient.semester,
                    # Dental examination data
                    oral_hygiene=random.choice(['Good', 'Fair', 'Poor']),
                    gingiva=random.choice(['Normal', 'Inflamed', 'Bleeding']),
                    teeth_condition={
                        'cavities': random.randint(0, 5),
                        'fillings': random.randint(0, 3),
                        'missing': random.randint(0, 2)
                    },
                    recommendations=f"Regular dental checkup recommended. {treatment} completed successfully."
                )
                dental_records.append(dental_data)
                
        return dental_records
        
    def create_medical_documents(self, patients, school_year):
        """Create medical document submissions for certificates"""
        medical_docs = []
        statuses = ['pending', 'for_consultation', 'verified', 'issued']
        
        # Create medical document submissions for random patients
        for patient in random.sample(patients, 60):  # 60 patients submitted documents
            doc = MedicalDocument.objects.create(
                patient=patient,
                academic_year=school_year,
                status=random.choice(statuses),
                submitted_for_review=True,
                uploaded_at=timezone.now() - timedelta(days=random.randint(1, 120))
            )
            
            # Random document completion
            if random.choice([True, False]):
                doc.reviewed_at = timezone.now() - timedelta(days=random.randint(1, 30))
                
            if doc.status == 'issued':
                doc.certificate_issued_at = timezone.now() - timedelta(days=random.randint(1, 14))
                
            doc.save()
            medical_docs.append(doc)
            
        return medical_docs
        
    def create_appointments(self, patients, staff_users, school_year):
        """Create appointment records"""
        appointments = []
        doctors = [user for user in staff_users if user.user_type == 'doctor']
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        appointment_types = ['medical', 'dental']
        
        # Create appointments for random patients
        for patient in random.sample(patients, 120):  # 120 patients with appointments
            num_appointments = random.randint(1, 3)
            for _ in range(num_appointments):
                # Random date within the next 30 days or past 60 days
                if random.choice([True, False]):
                    appointment_date = date.today() + timedelta(days=random.randint(1, 30))
                    status = random.choice(['pending', 'confirmed', 'scheduled'])
                else:
                    appointment_date = date.today() - timedelta(days=random.randint(1, 60))
                    status = random.choice(['completed', 'cancelled'])
                
                appointment_time = time(random.randint(8, 16), random.choice([0, 30]))
                doctor = random.choice(doctors) if doctors else None
                appt_type = random.choice(appointment_types)
                
                appointment = Appointment.objects.create(
                    patient=patient,
                    doctor=doctor,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    purpose=f"{appt_type.title()} consultation",
                    status=status,
                    type=appt_type,
                    concern=f"Regular {appt_type} checkup" if appt_type == 'dental' else None,
                    campus='a',
                    school_year=school_year,
                    semester=patient.semester,
                    notes=f"Appointment for {appt_type} consultation" if status == 'completed' else ""
                )
                appointments.append(appointment)
                
        return appointments

def main():
    """Main execution function"""
    try:
        creator = ComprehensiveSampleDataCreator()
        creator.run()
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
