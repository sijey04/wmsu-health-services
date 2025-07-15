from django.core.management.base import BaseCommand
from api.models import Appointment, AcademicSchoolYear

class Command(BaseCommand):
    help = 'Update existing appointments with semester information'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS('🔄 Updating Appointment Semesters'))
        self.stdout.write('=' * 50)
        
        # Get all appointments without semester assignments
        appointments_to_update = Appointment.objects.filter(semester__isnull=True)
        total_count = appointments_to_update.count()
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('✅ All appointments already have semester assignments!'))
            return
        
        self.stdout.write(f'📊 Found {total_count} appointments without semester assignments')
        
        updated_count = 0
        error_count = 0
        
        for appointment in appointments_to_update:
            try:
                # Determine semester based on appointment date and school year
                if appointment.school_year and appointment.appointment_date:
                    semester = appointment.determine_semester()
                    
                    if semester:
                        if not dry_run:
                            appointment.semester = semester
                            appointment.save(update_fields=['semester'])
                        
                        updated_count += 1
                        semester_display = appointment.get_semester_display() if hasattr(appointment, 'get_semester_display') else semester
                        
                        self.stdout.write(
                            f'✅ {"[DRY RUN] " if dry_run else ""}Updated appointment {appointment.id}: '
                            f'{appointment.appointment_date} → {semester_display}'
                        )
                    else:
                        error_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f'⚠️  Appointment {appointment.id} on {appointment.appointment_date} '
                                f'does not fall within any semester period for {appointment.school_year.academic_year if appointment.school_year else "unknown year"}'
                            )
                        )
                else:
                    error_count += 1
                    missing_info = []
                    if not appointment.school_year:
                        missing_info.append('school year')
                    if not appointment.appointment_date:
                        missing_info.append('appointment date')
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  Appointment {appointment.id} missing: {", ".join(missing_info)}'
                        )
                    )
                        
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'❌ Error processing appointment {appointment.id}: {str(e)}')
                )
        
        # Summary
        self.stdout.write('')
        self.stdout.write(f'📈 Summary:')
        self.stdout.write(f'   Total processed: {total_count}')
        self.stdout.write(f'   Successfully updated: {updated_count}')
        self.stdout.write(f'   Errors/Skipped: {error_count}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 This was a dry run. Use --no-dry-run to apply changes.'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ Semester assignment complete!'))
        
        # Show current statistics
        self.stdout.write('')
        self.stdout.write('📊 Current Appointment Statistics by Semester:')
        
        first_sem = Appointment.objects.filter(semester='1st_semester').count()
        second_sem = Appointment.objects.filter(semester='2nd_semester').count()
        summer = Appointment.objects.filter(semester='summer').count()
        unassigned = Appointment.objects.filter(semester__isnull=True).count()
        
        self.stdout.write(f'   📚 First Semester: {first_sem}')
        self.stdout.write(f'   📚 Second Semester: {second_sem}')
        self.stdout.write(f'   ☀️ Summer Semester: {summer}')
        self.stdout.write(f'   ❓ Unassigned: {unassigned}')
