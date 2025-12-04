from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, date, timedelta, time
import random
from api.models import (
    CustomUser, Patient, AcademicSchoolYear, MedicalRecord, Appointment,
    MedicalDocument, StaffDetails, DentalFormData
)

class Command(BaseCommand):
    help = 'Create comprehensive sample data for WMSU Health Services'
    
    def __init__(self):
        super().__init__()
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
            'Gloria', 'Alejandro', 'Esperanza', 'Ricardo', 'Mercedes', 'Carlos', 'Dolores'
        ]
        self.last_names = [
            'Santos', 'Reyes', 'Cruz', 'Garcia', 'Rodriguez', 'Gonzalez', 'Hernandez',
            'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores',
            'Rivera', 'Gomez', 'Diaz', 'Morales', 'Jimenez', 'Alvarez', 'Ruiz'
        ]

    def handle(self, *args, **options):
        self.stdout.write('Creating comprehensive sample data for WMSU Health Services...')
        
        # 1. Create Academic Year
        school_year = self.create_academic_year()
        self.stdout.write(f'Created academic year: {school_year}')
        
        # 2. Create Staff Users
        staff_users = self.create_staff_users()
        self.stdout.write(f'Created {len(staff_users)} staff users')
        
        # 3. Create Student/Employee Users with Patient Profiles
        patients = self.create_patients_with_users(school_year, 100)
        self.stdout.write(f'Created {len(patients)} patients with user accounts')
        
        # 4. Create Medical Records and Consultations
        medical_records = self.create_medical_records(patients, staff_users)
        self.stdout.write(f'Created {len(medical_records)} medical records')
        
        # 5. Create Dental Consultations
        dental_records = self.create_dental_consultations(patients, staff_users, school_year)
        self.stdout.write(f'Created {len(dental_records)} dental consultation records')
        
        # 6. Create Medical Documents (Certificate Requests)
        medical_docs = self.create_medical_documents(patients, school_year)
        self.stdout.write(f'Created {len(medical_docs)} medical document submissions')
        
        # 7. Create Appointments
        appointments = self.create_appointments(patients, staff_users, school_year)
        self.stdout.write(f'Created {len(appointments)} appointments')
        
        self.stdout.write(self.style.SUCCESS('Successfully created comprehensive sample data!'))
        self.stdout.write(f'Database now contains:')
        self.stdout.write(f'   - Users: {CustomUser.objects.count()}')
        self.stdout.write(f'   - Patient Profiles: {Patient.objects.count()}')
        self.stdout.write(f'   - Medical Records: {MedicalRecord.objects.count()}')
        self.stdout.write(f'   - Dental Consultations: {DentalFormData.objects.count()}')
        self.stdout.write(f'   - Medical Documents: {MedicalDocument.objects.count()}')
        self.stdout.write(f'   - Appointments: {Appointment.objects.count()}')
        
    def create_academic_year(self):
        year_str = f"{self.current_year}-{self.current_year + 1}"
        
        school_year, created = AcademicSchoolYear.objects.get_or_create(
            academic_year=year_str,
            defaults={
                'start_date': date(self.current_year, 8, 15),
                'end_date': date(self.current_year + 1, 5, 31),
                'first_sem_start': date(self.current_year, 8, 15),
                'first_sem_end': date(self.current_year, 12, 20),
                'second_sem_start': date(self.current_year + 1, 1, 15),
                'second_sem_end': date(self.current_year + 1, 5, 31),
                'summer_start': date(self.current_year + 1, 6, 1),
                'summer_end': date(self.current_year + 1, 7, 31),
                'is_current': True,
                'status': 'active'
            }
        )
        return school_year
        
    def create_staff_users(self):
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
                    'is_email_verified': True
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                
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
        
    def create_patients_with_users(self, school_year, count=100):
        patients = []
        semesters = ['1st_semester', '2nd_semester', 'summer']
        
        for i in range(count):
            education_level = random.choice(self.education_levels)
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            
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
                    'is_email_verified': True
                }
            )
            
            if created:
                user.set_password('password123')
                user.save()
            
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
                    'address': f"{random.randint(1, 999)} Main Street",
                    'city_municipality': random.choice(['Zamboanga City', 'Isabela', 'Tumaga']),
                    'barangay': f"Brgy. {random.choice(['San Jose', 'Santa Maria', 'San Pedro'])}",
                    'blood_type': random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
                    'religion': random.choice(['Roman Catholic', 'Islam', 'Protestant']),
                    'nationality': 'Filipino',
                    'civil_status': random.choice(['single', 'married', 'widowed']),
                    'school_year': school_year,
                    'semester': random.choice(semesters),
                    'emergency_contact_surname': random.choice(self.last_names),
                    'emergency_contact_first_name': random.choice(self.first_names),
                    'emergency_contact_number': f"09{random.randint(100000000, 999999999)}",
                    'emergency_contact_relationship': random.choice(['Parent', 'Spouse', 'Sibling'])
                }
            )
            
            patients.append(patient)
            
        return patients
        
    def create_medical_records(self, patients, staff_users):
        medical_records = []
        doctors = [user for user in staff_users if user.user_type == 'doctor' and hasattr(user, 'staff_details') and 'M.D.' in user.staff_details.full_name]
        
        conditions = [
            'Upper Respiratory Tract Infection', 'Headache', 'Fever', 'Cough and Colds',
            'Stomach Pain', 'Allergic Reaction', 'Minor Injury', 'Hypertension'
        ]
        
        treatments = [
            'Rest and hydration', 'Prescribed pain medication', 'Antibiotic therapy',
            'Allergy medication', 'Physical therapy exercises'
        ]
        
        for patient in patients[:60]:  # Create records for first 60 patients
            num_records = random.randint(1, 3)
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
                    notes=f"Patient responded well to treatment." if random.choice([True, False]) else "",
                    school_year=patient.school_year
                )
                medical_records.append(record)
                
        return medical_records
        
    def create_dental_consultations(self, patients, staff_users, school_year):
        dental_records = []
        dentists = [user for user in staff_users if user.user_type == 'doctor' and hasattr(user, 'staff_details') and 'D.M.D.' in user.staff_details.full_name]
        
        dental_conditions = [
            'Tooth Decay', 'Gingivitis', 'Tooth Cleaning', 'Tooth Extraction',
            'Dental Filling', 'Root Canal', 'Orthodontic Consultation'
        ]
        
        dental_treatments = [
            'Dental prophylaxis', 'Composite filling', 'Tooth extraction', 'Root canal therapy',
            'Scaling and polishing', 'Fluoride treatment'
        ]
        
        for patient in random.sample(patients, 50):  # 50 patients with dental visits
            num_visits = random.randint(1, 2)
            for _ in range(num_visits):
                visit_date = timezone.now() - timedelta(days=random.randint(1, 180))
                dentist = random.choice(dentists) if dentists else None
                condition = random.choice(dental_conditions)
                treatment = random.choice(dental_treatments)
                
                dental_data = DentalFormData.objects.create(
                    patient=patient,
                    academic_year=school_year,
                    surname=patient.user.last_name if patient.user else patient.name.split(',')[0],
                    first_name=patient.user.first_name if patient.user else patient.name.split(',')[1].strip() if ',' in patient.name else patient.name,
                    age=random.randint(16, 25),
                    sex=random.choice(['Male', 'Female']),
                    has_toothbrush=random.choice(['Yes', 'No']),
                    dentition=random.choice(['Satisfactory', 'Fair', 'Poor']),
                    periodontal=random.choice(['Satisfactory', 'Fair', 'Poor']),
                    occlusion=random.choice(['Normal', 'Malocclusion']),
                    malocclusion_severity=random.choice(['Mild', 'Moderate', 'Severe']) if random.choice([True, False]) else None
                )
                dental_records.append(dental_data)
                
        return dental_records
        
    def create_medical_documents(self, patients, school_year):
        medical_docs = []
        statuses = ['pending', 'for_consultation', 'verified', 'issued']
        
        for patient in random.sample(patients, 40):  # 40 patients submitted documents
            doc = MedicalDocument.objects.create(
                patient=patient,
                academic_year=school_year,
                status=random.choice(statuses),
                submitted_for_review=True,
                uploaded_at=timezone.now() - timedelta(days=random.randint(1, 120))
            )
            
            if random.choice([True, False]):
                doc.reviewed_at = timezone.now() - timedelta(days=random.randint(1, 30))
                
            if doc.status == 'issued':
                doc.certificate_issued_at = timezone.now() - timedelta(days=random.randint(1, 14))
                
            doc.save()
            medical_docs.append(doc)
            
        return medical_docs
        
    def create_appointments(self, patients, staff_users, school_year):
        appointments = []
        doctors = [user for user in staff_users if user.user_type == 'doctor']
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        appointment_types = ['medical', 'dental']
        
        for patient in random.sample(patients, 80):  # 80 patients with appointments
            num_appointments = random.randint(1, 2)
            for _ in range(num_appointments):
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
