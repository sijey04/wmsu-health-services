from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q, Count
from api.models import Patient, CustomUser

class Command(BaseCommand):
    help = 'Populate user_type field in Patient model for proper demographic tracking'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-samples',
            action='store_true',
            help='Create sample data if no patients exist',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting user type population...'))
        
        # Mapping from CustomUser fields to standardized user types
        education_level_mapping = {
            'college': 'College',
            'high school': 'High School',
            'senior high school': 'Senior High School', 
            'elementary': 'Elementary',
            'employee': 'Employee',
            'staff': 'Employee',
            'admin': 'Employee'
        }
        
        user_type_mapping = {
            'student': 'College',  # Default student type
            'staff': 'Employee',
            'admin': 'Employee'
        }
        
        # Get all patients to update (including those with existing user_type for proper mapping)
        if options['create_samples']:
            # For samples, get all patients
            patients_to_update = Patient.objects.all()
        else:
            # For production, only update those without proper standardized user types
            patients_to_update = Patient.objects.filter(
                Q(user_type__isnull=True) | 
                Q(user_type='') |
                Q(user_type__in=[
                    'Faculty', 'Undergraduate', 'Postgraduate', 'Doctoral',
                    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
                    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
                ])  # Include improperly formatted user types
            )
        
        # Helper function to determine proper user type from various fields
        def determine_user_type(patient):
            """Determine the proper standardized user type for a patient"""
            
            # Check education_level first
            if patient.user.education_level:
                education_level = patient.user.education_level.lower()
                
                if education_level in education_level_mapping:
                    return education_level_mapping[education_level]
            
            # Check user_type
            if patient.user.user_type:
                user_type_lower = patient.user.user_type.lower()
                if user_type_lower in user_type_mapping:
                    return user_type_mapping[user_type_lower]
            
            # Check grade_level for specific mapping
            if patient.user.grade_level:
                grade_level = patient.user.grade_level.lower().strip()
                
                # Kindergarten
                if 'kindergarten' in grade_level or 'kinder' in grade_level:
                    return 'Kindergarten'
                
                # Elementary (Grades 1-6)
                elif any(grade in grade_level for grade in ['grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6']) or 'elementary' in grade_level:
                    return 'Elementary'
                
                # High School (Grades 7-10)
                elif any(grade in grade_level for grade in ['grade 7', 'grade 8', 'grade 9', 'grade 10']) or 'high school' in grade_level:
                    return 'High School'
                
                # Senior High School (Grades 11-12)
                elif any(grade in grade_level for grade in ['grade 11', 'grade 12']) or 'senior high' in grade_level or 'senior' in grade_level:
                    return 'Senior High School'
                
                # College level terms
                elif any(term in grade_level for term in ['undergraduate', 'bachelor', 'college', '1st year', '2nd year', '3rd year', '4th year']):
                    return 'College'
                
                # Graduate level terms - map to College
                elif any(term in grade_level for term in ['postgraduate', 'graduate', 'masters', 'doctoral', 'phd']):
                    return 'College'
                
                # Employee/Faculty terms
                elif any(term in grade_level for term in ['faculty', 'staff', 'employee', 'teacher', 'professor']):
                    return 'Employee'
                
                # Incoming freshman
                elif any(term in grade_level for term in ['incoming', 'freshman', 'new student']):
                    return 'Incoming Freshman'
            
            # Check employee-related fields
            if (patient.user.employee_position or 
                getattr(patient, 'employee_id', None) or
                getattr(patient, 'position_type', None)):
                return 'Employee'
            
            # Default fallback
            return 'College'

        updated_count = 0
        
        with transaction.atomic():
            for patient in patients_to_update:
                if patient.user:
                    user_type = determine_user_type(patient)
                    
                    # Debug output for first few records
                    if updated_count < 5:
                        self.stdout.write(f"Debug: Patient {patient.name}")
                        self.stdout.write(f"  Grade level: {patient.user.grade_level}")
                        self.stdout.write(f"  Determined user type: {user_type}")
                else:
                    user_type = 'College'  # Default fallback
                
                # Update the patient record
                patient.user_type = user_type
                patient.save(update_fields=['user_type'])
                updated_count += 1
                
                self.stdout.write(f"Updated patient {patient.name} ({patient.student_id}) -> {user_type}")
        
        self.stdout.write(self.style.SUCCESS(f'Completed! Updated {updated_count} patient records.'))
        
        # Create sample data if requested and no patients exist
        if options['create_samples'] and Patient.objects.count() == 0:
            self._create_sample_data()
        
        # Show summary of user types
        self._show_summary()

    def _create_sample_data(self):
        """Create sample user type data for testing"""
        self.stdout.write('No patients found. Creating sample data...')
        
        from django.contrib.auth.hashers import make_password
        
        sample_data = [
            {'user_type': 'College', 'count': 15},
            {'user_type': 'High School', 'count': 10},
            {'user_type': 'Senior High School', 'count': 8},
            {'user_type': 'Elementary', 'count': 5},
            {'user_type': 'Employee', 'count': 3},
        ]
        
        with transaction.atomic():
            for data in sample_data:
                for i in range(data['count']):
                    # Create user
                    user = CustomUser.objects.create(
                        username=f"{data['user_type'].lower().replace(' ', '_')}_{i+1}",
                        email=f"{data['user_type'].lower().replace(' ', '_')}_{i+1}@wmsu.edu.ph",
                        first_name=f"Test{i+1}",
                        last_name=data['user_type'].replace(' ', ''),
                        password=make_password('password123'),
                        user_type='student' if data['user_type'] != 'Employee' else 'staff',
                        education_level=data['user_type'] if data['user_type'] != 'Employee' else None,
                        is_email_verified=True
                    )
                    
                    # Create patient
                    Patient.objects.create(
                        user=user,
                        student_id=f"{data['user_type'][:3].upper()}-{i+1:04d}",
                        name=f"{user.last_name}, {user.first_name}",
                        first_name=user.first_name,
                        user_type=data['user_type'],
                        email=user.email
                    )
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

    def _show_summary(self):
        """Show summary of user types"""
        self.stdout.write('\nUser Type Distribution:')
        user_type_counts = Patient.objects.values('user_type').annotate(count=Count('id')).order_by('-count')
        
        for item in user_type_counts:
            user_type = item['user_type'] or 'Not Set'
            count = item['count']
            self.stdout.write(f"  {user_type}: {count} patients")
