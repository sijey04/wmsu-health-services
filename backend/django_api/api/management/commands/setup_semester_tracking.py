from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, timedelta
from api.semester_models import (
    AcademicSemester, 
    SemesterHealthRequirement,
    StudentSemesterProfile,
    StudentRequirementStatus
)
from api.models import Patient


class Command(BaseCommand):
    help = 'Set up initial semester tracking data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--academic-year',
            type=str,
            default='2024-2025',
            help='Academic year to set up (default: 2024-2025)'
        )
        parser.add_argument(
            '--create-profiles',
            action='store_true',
            help='Create student profiles for existing patients'
        )
    
    def handle(self, *args, **options):
        academic_year = options['academic_year']
        create_profiles = options['create_profiles']
        
        self.stdout.write(
            self.style.SUCCESS(f'Setting up semester tracking for {academic_year}')
        )
        
        with transaction.atomic():
            # Create semesters
            self.create_semesters(academic_year)
            
            # Create default health requirements
            self.create_health_requirements(academic_year)
            
            # Create student profiles if requested
            if create_profiles:
                self.create_student_profiles(academic_year)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully set up semester tracking system!')
        )
    
    def create_semesters(self, academic_year):
        """Create academic semesters for the year"""
        self.stdout.write('Creating academic semesters...')
        
        # Calculate dates based on academic year
        start_year = int(academic_year.split('-')[0])
        
        semesters_data = [
            {
                'semester_type': '1st',
                'start_date': date(start_year, 8, 15),  # August 15
                'end_date': date(start_year, 12, 20),   # December 20
                'enrollment_start': date(start_year, 6, 1),  # June 1
                'enrollment_end': date(start_year, 8, 10),   # August 10
                'status': 'active',
                'is_current': True,
            },
            {
                'semester_type': '2nd',
                'start_date': date(start_year + 1, 1, 8),   # January 8
                'end_date': date(start_year + 1, 5, 25),    # May 25
                'enrollment_start': date(start_year, 11, 1), # November 1
                'enrollment_end': date(start_year + 1, 1, 5), # January 5
                'status': 'upcoming',
                'is_current': False,
            },
            {
                'semester_type': 'summer',
                'start_date': date(start_year + 1, 6, 1),   # June 1
                'end_date': date(start_year + 1, 7, 31),    # July 31
                'enrollment_start': date(start_year + 1, 4, 1), # April 1
                'enrollment_end': date(start_year + 1, 5, 25),  # May 25
                'status': 'upcoming',
                'is_current': False,
            }
        ]
        
        for semester_data in semesters_data:
            semester, created = AcademicSemester.objects.get_or_create(
                semester_type=semester_data['semester_type'],
                academic_year=academic_year,
                defaults=semester_data
            )
            
            if created:
                self.stdout.write(
                    f'  ✓ Created {semester.get_semester_type_display()} {academic_year}'
                )
            else:
                self.stdout.write(
                    f'  - {semester.get_semester_type_display()} {academic_year} already exists'
                )
    
    def create_health_requirements(self, academic_year):
        """Create default health requirements for each semester"""
        self.stdout.write('Creating health requirements...')
        
        semesters = AcademicSemester.objects.filter(academic_year=academic_year)
        
        # Default requirements for all semesters
        default_requirements = [
            {
                'requirement_type': 'medical_exam',
                'name': 'Annual Medical Examination',
                'description': 'Complete medical examination including physical assessment',
                'applies_to': 'all',
                'is_mandatory': True,
                'validity_period_months': 12,
                'reminder_days_before': 30,
            },
            {
                'requirement_type': 'chest_xray',
                'name': 'Chest X-ray',
                'description': 'Chest X-ray for tuberculosis screening',
                'applies_to': 'all',
                'is_mandatory': True,
                'validity_period_months': 12,
                'reminder_days_before': 30,
            },
            {
                'requirement_type': 'vaccination',
                'name': 'Vaccination Status Check',
                'description': 'Verification of up-to-date vaccination status',
                'applies_to': 'all',
                'is_mandatory': True,
                'validity_period_months': 12,
                'reminder_days_before': 30,
            },
        ]
        
        # Additional requirements for freshmen
        freshmen_requirements = [
            {
                'requirement_type': 'blood_test',
                'name': 'Complete Blood Count (CBC)',
                'description': 'Complete blood count test',
                'applies_to': 'freshmen',
                'is_mandatory': True,
                'validity_period_months': 6,
                'reminder_days_before': 15,
            },
            {
                'requirement_type': 'urinalysis',
                'name': 'Urinalysis',
                'description': 'Complete urinalysis test',
                'applies_to': 'freshmen',
                'is_mandatory': True,
                'validity_period_months': 6,
                'reminder_days_before': 15,
            },
            {
                'requirement_type': 'drug_test',
                'name': 'Drug Test',
                'description': 'Drug screening test',
                'applies_to': 'freshmen',
                'is_mandatory': True,
                'validity_period_months': 12,
                'reminder_days_before': 30,
            },
            {
                'requirement_type': 'hepatitis_b',
                'name': 'Hepatitis B Surface Antigen Test',
                'description': 'Required for specific courses (Medicine, Nursing, etc.)',
                'applies_to': 'specific_courses',
                'specific_courses': [
                    'College of Medicine',
                    'College of Nursing', 
                    'College of Home Economics',
                    'College of Criminal Justice Education',
                    'BS Food Technology',
                    'BS Biology'
                ],
                'is_mandatory': True,
                'validity_period_months': 12,
                'reminder_days_before': 30,
            },
        ]
        
        for semester in semesters:
            # Create default requirements for all semesters
            for req_data in default_requirements:
                due_date = semester.start_date - timedelta(days=30)  # Due 30 days before semester starts
                
                requirement, created = SemesterHealthRequirement.objects.get_or_create(
                    semester=semester,
                    requirement_type=req_data['requirement_type'],
                    applies_to=req_data['applies_to'],
                    defaults={
                        **req_data,
                        'due_date': due_date,
                    }
                )
                
                if created:
                    self.stdout.write(
                        f'  ✓ Created {requirement.name} for {semester}'
                    )
            
            # Create freshmen requirements only for 1st semester
            if semester.semester_type == '1st':
                for req_data in freshmen_requirements:
                    due_date = semester.start_date - timedelta(days=15)  # Due 15 days before semester starts
                    
                    requirement, created = SemesterHealthRequirement.objects.get_or_create(
                        semester=semester,
                        requirement_type=req_data['requirement_type'],
                        applies_to=req_data['applies_to'],
                        defaults={
                            **req_data,
                            'due_date': due_date,
                        }
                    )
                    
                    if created:
                        self.stdout.write(
                            f'  ✓ Created {requirement.name} for {semester} (freshmen)'
                        )
    
    def create_student_profiles(self, academic_year):
        """Create student semester profiles for existing patients"""
        self.stdout.write('Creating student semester profiles...')
        
        # Get current semester
        current_semester = AcademicSemester.objects.filter(
            academic_year=academic_year,
            is_current=True
        ).first()
        
        if not current_semester:
            self.stdout.write(
                self.style.WARNING('No current semester found, skipping profile creation')
            )
            return
        
        # Get all patients
        patients = Patient.objects.all()
        created_count = 0
        
        for patient in patients:
            # Determine year level based on student ID or department
            year_level = self.determine_year_level(patient)
            course_program = patient.department or 'Unknown'
            
            # Create profile for current semester
            profile, created = StudentSemesterProfile.objects.get_or_create(
                patient=patient,
                semester=current_semester,
                defaults={
                    'year_level': year_level,
                    'course_program': course_program,
                    'enrollment_status': 'enrolled',
                    'health_status': 'pending',
                }
            )
            
            if created:
                created_count += 1
                
                # Create requirement statuses for this student
                self.create_requirement_statuses(profile)
        
        self.stdout.write(
            f'  ✓ Created {created_count} student semester profiles'
        )
    
    def determine_year_level(self, patient):
        """Determine year level from student ID or other indicators"""
        if not patient.student_id:
            return '1st Year'
        
        # Extract year from student ID (assuming format like 2024-0001)
        try:
            id_parts = patient.student_id.split('-')
            if len(id_parts) >= 2:
                year = int(id_parts[0])
                current_year = date.today().year
                years_enrolled = current_year - year
                
                if years_enrolled <= 0:
                    return '1st Year'
                elif years_enrolled == 1:
                    return '2nd Year'
                elif years_enrolled == 2:
                    return '3rd Year'
                elif years_enrolled >= 3:
                    return '4th Year'
        except (ValueError, IndexError):
            pass
        
        return '1st Year'  # Default
    
    def create_requirement_statuses(self, student_profile):
        """Create requirement statuses for a student profile"""
        # Get all requirements for this semester
        requirements = SemesterHealthRequirement.objects.filter(
            semester=student_profile.semester,
            is_active=True
        )
        
        for requirement in requirements:
            # Check if requirement applies to this student
            if requirement.is_applicable_to_student(student_profile):
                StudentRequirementStatus.objects.get_or_create(
                    student_profile=student_profile,
                    requirement=requirement,
                    defaults={'status': 'pending'}
                )
