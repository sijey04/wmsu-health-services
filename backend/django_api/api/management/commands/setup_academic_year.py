from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import AcademicSchoolYear
from datetime import date, datetime


class Command(BaseCommand):
    help = 'Create or update academic school year with semester periods'

    def add_arguments(self, parser):
        parser.add_argument('academic_year', type=str, help='Academic year (e.g., 2025-2026)')
        parser.add_argument('--first-sem-start', type=str, help='First semester start date (YYYY-MM-DD)')
        parser.add_argument('--first-sem-end', type=str, help='First semester end date (YYYY-MM-DD)')
        parser.add_argument('--second-sem-start', type=str, help='Second semester start date (YYYY-MM-DD)')
        parser.add_argument('--second-sem-end', type=str, help='Second semester end date (YYYY-MM-DD)')
        parser.add_argument('--summer-start', type=str, help='Summer semester start date (YYYY-MM-DD)')
        parser.add_argument('--summer-end', type=str, help='Summer semester end date (YYYY-MM-DD)')
        parser.add_argument('--set-current', action='store_true', help='Set as current academic year')

    def handle(self, *args, **options):
        academic_year = options['academic_year']
        
        try:
            # Get or create the academic year
            school_year, created = AcademicSchoolYear.objects.get_or_create(
                academic_year=academic_year,
                defaults={
                    'start_date': date.today(),
                    'end_date': date.today(),
                    'status': 'upcoming'
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created new academic year: {academic_year}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Updating existing academic year: {academic_year}')
                )
            
            # Update semester dates if provided
            updated_fields = []
            
            if options['first_sem_start']:
                school_year.first_sem_start = datetime.strptime(options['first_sem_start'], '%Y-%m-%d').date()
                updated_fields.append('first_sem_start')
            
            if options['first_sem_end']:
                school_year.first_sem_end = datetime.strptime(options['first_sem_end'], '%Y-%m-%d').date()
                updated_fields.append('first_sem_end')
            
            if options['second_sem_start']:
                school_year.second_sem_start = datetime.strptime(options['second_sem_start'], '%Y-%m-%d').date()
                updated_fields.append('second_sem_start')
            
            if options['second_sem_end']:
                school_year.second_sem_end = datetime.strptime(options['second_sem_end'], '%Y-%m-%d').date()
                updated_fields.append('second_sem_end')
            
            if options['summer_start']:
                school_year.summer_start = datetime.strptime(options['summer_start'], '%Y-%m-%d').date()
                updated_fields.append('summer_start')
            
            if options['summer_end']:
                school_year.summer_end = datetime.strptime(options['summer_end'], '%Y-%m-%d').date()
                updated_fields.append('summer_end')
            
            if options['set_current']:
                school_year.is_current = True
                school_year.status = 'active'
                updated_fields.extend(['is_current', 'status'])
            
            # Save the changes
            if updated_fields:
                school_year.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated fields: {", ".join(updated_fields)}')
                )
            
            # Display current semester information
            current_semester = school_year.get_current_semester()
            semester_display = school_year.get_semester_display()
            
            self.stdout.write('\nAcademic Year Information:')
            self.stdout.write(f'  Academic Year: {school_year.academic_year}')
            self.stdout.write(f'  Status: {school_year.status}')
            self.stdout.write(f'  Is Current: {school_year.is_current}')
            self.stdout.write(f'  Current Semester: {semester_display}')
            
            if school_year.first_sem_start:
                self.stdout.write('\nSemester Periods:')
                self.stdout.write(f'  1st Semester: {school_year.first_sem_start} to {school_year.first_sem_end}')
                self.stdout.write(f'  2nd Semester: {school_year.second_sem_start} to {school_year.second_sem_end}')
                self.stdout.write(f'  Summer: {school_year.summer_start} to {school_year.summer_end}')
            
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Unexpected error: {e}'))
