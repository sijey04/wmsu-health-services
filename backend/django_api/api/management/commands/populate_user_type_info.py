"""
Django management command to populate UserTypeInformation database.

Usage:
    python manage.py populate_user_type_info
"""

from django.core.management.base import BaseCommand, CommandError
from api.models import UserTypeInformation


class Command(BaseCommand):
    help = 'Populate UserTypeInformation database with configurations for all user types'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing UserTypeInformation entries before populating',
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing entries instead of creating new ones',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔄 Starting UserTypeInformation population...')
        )
        
        # Define all available options
        all_departments = [
            "Academic Affairs", "Administration", "Admissions", "Business Administration",
            "Computer Science", "Education", "Engineering", "Finance", "Health Sciences",
            "Human Resources", "Information Technology", "Liberal Arts", "Library Services",
            "Maintenance", "Medical Services", "Nursing", "Physical Education", "Psychology",
            "Registrar", "Research", "Science", "Security", "Social Sciences", "Student Affairs", "Other"
        ]
        
        all_courses = [
            "BS Business Administration", "BS Computer Science", "BS Education", "BS Engineering",
            "BS Information Technology", "BS Nursing", "BS Psychology", "BA Communication",
            "BA Political Science", "BA Sociology"
        ]
        
        college_year_levels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
        high_school_year_levels = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"]
        senior_high_year_levels = ["Grade 11", "Grade 12"]
        elementary_year_levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
        kindergarten_year_levels = ["Kindergarten"]
        
        all_strands = [
            "ABM", "HUMSS", "STEM", "GAS", "TVL", "Arts and Design", "Sports"
        ]
        
        position_types = ["Teaching", "Non-Teaching"]
        
        # Common required fields for all user types
        base_required_fields = [
            "name", "first_name", "date_of_birth", "age", "gender", "blood_type", 
            "religion", "nationality", "civil_status", "email", "contact_number",
            "city_municipality", "barangay", "street", "emergency_contact_surname",
            "emergency_contact_first_name", "emergency_contact_number", 
            "emergency_contact_relationship", "emergency_contact_barangay", 
            "emergency_contact_street"
        ]
        
        # All services available by default
        all_services = ["medical", "dental", "certificate"]
        
        # User type configurations
        user_type_configs = [
            {
                "name": "Employee",
                "description": "University employees including teaching and non-teaching staff",
                "enabled": True,
                "required_fields": base_required_fields + ["employee_id", "department", "position_type"],
                "available_departments": all_departments,
                "position_types": position_types,
                "available_courses": [],
                "year_levels": [],
                "available_strands": []
            },
            {
                "name": "College",
                "description": "Undergraduate college students",
                "enabled": True,
                "required_fields": base_required_fields + ["course", "year_level"],
                "available_departments": [],
                "position_types": [],
                "available_courses": all_courses,
                "year_levels": college_year_levels,
                "available_strands": []
            },
            {
                "name": "Incoming Freshman",
                "description": "New college students entering their first year",
                "enabled": True,
                "required_fields": base_required_fields + ["course", "year_level"],
                "available_departments": [],
                "position_types": [],
                "available_courses": all_courses,
                "year_levels": ["1st Year"],  # Only 1st year for incoming freshmen
                "available_strands": []
            },
            {
                "name": "High School",
                "description": "Junior high school students (Grades 7-10)",
                "enabled": True,
                "required_fields": base_required_fields + ["year_level"],
                "available_departments": [],
                "position_types": [],
                "available_courses": [],
                "year_levels": high_school_year_levels,
                "available_strands": []
            },
            {
                "name": "Senior High School",
                "description": "Senior high school students (Grades 11-12)",
                "enabled": True,
                "required_fields": base_required_fields + ["year_level", "strand"],
                "available_departments": [],
                "position_types": [],
                "available_courses": [],
                "year_levels": senior_high_year_levels,
                "available_strands": all_strands
            },
            {
                "name": "Elementary",
                "description": "Elementary school students (Grades 1-6)",
                "enabled": True,
                "required_fields": base_required_fields + ["year_level"],
                "available_departments": [],
                "position_types": [],
                "available_courses": [],
                "year_levels": elementary_year_levels,
                "available_strands": []
            },
            {
                "name": "Kindergarten",
                "description": "Kindergarten students",
                "enabled": True,
                "required_fields": base_required_fields + ["year_level"],
                "available_departments": [],
                "position_types": [],
                "available_courses": [],
                "year_levels": kindergarten_year_levels,
                "available_strands": []
            }
        ]
        
        # Clear existing entries if requested
        if options['clear']:
            self.stdout.write("🗑️  Clearing existing UserTypeInformation entries...")
            UserTypeInformation.objects.all().delete()
        
        # Create or update entries
        created_count = 0
        updated_count = 0
        
        for config in user_type_configs:
            try:
                if options['update']:
                    # Try to update existing entry
                    user_type_info, created = UserTypeInformation.objects.update_or_create(
                        name=config["name"],
                        defaults={
                            'description': config["description"],
                            'enabled': config["enabled"],
                            'required_fields': config["required_fields"],
                            'available_courses': config["available_courses"],
                            'available_departments': config["available_departments"],
                            'year_levels': config["year_levels"],
                            'available_strands': config["available_strands"],
                            'position_types': config["position_types"]
                        }
                    )
                    if created:
                        created_count += 1
                        action = "Created"
                    else:
                        updated_count += 1
                        action = "Updated"
                else:
                    # Create new entry
                    user_type_info = UserTypeInformation(
                        name=config["name"],
                        description=config["description"],
                        enabled=config["enabled"],
                        required_fields=config["required_fields"],
                        available_courses=config["available_courses"],
                        available_departments=config["available_departments"],
                        year_levels=config["year_levels"],
                        available_strands=config["available_strands"],
                        position_types=config["position_types"]
                    )
                    user_type_info.save()
                    created_count += 1
                    action = "Created"
                
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {action} UserTypeInformation for: {config['name']}")
                )
                self.stdout.write(f"   - Description: {config['description']}")
                self.stdout.write(f"   - Required Fields: {len(config['required_fields'])} fields")
                
                if config['available_courses']:
                    self.stdout.write(f"   - Available Courses: {len(config['available_courses'])} courses")
                if config['available_departments']:
                    self.stdout.write(f"   - Available Departments: {len(config['available_departments'])} departments")
                if config['year_levels']:
                    self.stdout.write(f"   - Available Year Levels: {', '.join(config['year_levels'])}")
                if config['available_strands']:
                    self.stdout.write(f"   - Available Strands: {', '.join(config['available_strands'])}")
                if config['position_types']:
                    self.stdout.write(f"   - Available Position Types: {', '.join(config['position_types'])}")
                
                self.stdout.write("")
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"❌ Error creating UserTypeInformation for {config['name']}: {str(e)}")
                )
        
        if options['update']:
            self.stdout.write(
                self.style.SUCCESS(f"🎉 Successfully processed {created_count + updated_count} UserTypeInformation configurations!")
            )
            self.stdout.write(f"   - Created: {created_count}")
            self.stdout.write(f"   - Updated: {updated_count}")
        else:
            self.stdout.write(
                self.style.SUCCESS(f"🎉 Successfully created {created_count} UserTypeInformation configurations!")
            )
        
        self.stdout.write(f"📊 Total configurations in database: {UserTypeInformation.objects.count()}")
        
        # Verify the created entries
        self.stdout.write("\n📋 Verification - UserTypeInformation entries:")
        for uti in UserTypeInformation.objects.all().order_by('name'):
            self.stdout.write(f"   - {uti.name} - Enabled: {uti.enabled}")
        
        self.stdout.write(
            self.style.SUCCESS("\n✨ UserTypeInformation population completed successfully!")
        )
