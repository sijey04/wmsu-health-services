from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from api.models import CustomUser, StaffDetails

class Command(BaseCommand):
    help = 'Create default admin and staff accounts for WMSU Health Services'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Reset existing accounts')

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("WMSU HEALTH SERVICES - ACCOUNT SETUP")
        self.stdout.write("=" * 60)
        
        # Default accounts to create
        default_accounts = [
            {
                'email': 'admin@wmsu.edu.ph',
                'username': 'admin',
                'first_name': 'System',
                'last_name': 'Administrator',
                'password': 'admin123',
                'user_type': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'staff_details': {
                    'full_name': 'System Administrator',
                    'position': 'System Administrator',
                    'campus_assigned': 'a'
                }
            },
            {
                'email': 'doctor.main@wmsu.edu.ph',
                'username': 'doctor_main',
                'first_name': 'Felicitas',
                'last_name': 'Elago',
                'middle_name': 'C.',
                'password': 'wmsu2024',
                'user_type': 'staff',
                'is_staff': True,
                'staff_details': {
                    'full_name': 'Dr. Felicitas C. Elago',
                    'position': 'Chief Medical Officer',
                    'campus_assigned': 'a',
                    'license_number': 'MD-12345',
                    'phone_number': '+639123456789'
                }
            },
            {
                'email': 'nurse.head@wmsu.edu.ph',
                'username': 'nurse_head',
                'first_name': 'Maria',
                'last_name': 'Santos',
                'password': 'wmsu2024',
                'user_type': 'staff',
                'is_staff': True,
                'staff_details': {
                    'full_name': 'Maria Santos, RN',
                    'position': 'Head Nurse',
                    'campus_assigned': 'a',
                    'license_number': 'RN-67890',
                    'phone_number': '+639987654321'
                }
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for account_data in default_accounts:
            email = account_data['email']
            
            try:
                with transaction.atomic():
                    # Check if user exists
                    user, created = CustomUser.objects.get_or_create(
                        email=email,
                        defaults={
                            'username': account_data['username'],
                            'first_name': account_data['first_name'],
                            'last_name': account_data['last_name'],
                            'middle_name': account_data.get('middle_name', ''),
                            'password': make_password(account_data['password']),
                            'user_type': account_data['user_type'],
                            'is_staff': account_data['is_staff'],
                            'is_superuser': account_data.get('is_superuser', False),
                            'is_email_verified': True  # Auto-verify default accounts
                        }
                    )
                    
                    if created:
                        self.stdout.write(f"✓ Created {account_data['user_type']}: {email}")
                        created_count += 1
                    else:
                        if options['reset']:
                            # Update existing user
                            user.username = account_data['username']
                            user.first_name = account_data['first_name']
                            user.last_name = account_data['last_name']
                            user.middle_name = account_data.get('middle_name', '')
                            user.password = make_password(account_data['password'])
                            user.user_type = account_data['user_type']
                            user.is_staff = account_data['is_staff']
                            user.is_superuser = account_data.get('is_superuser', False)
                            user.is_email_verified = True
                            user.save()
                            self.stdout.write(f"↻ Updated {account_data['user_type']}: {email}")
                            updated_count += 1
                        else:
                            self.stdout.write(f"⚠ Exists {account_data['user_type']}: {email}")
                    
                    # Create or update staff details if applicable
                    if account_data['user_type'] in ['staff', 'admin'] and 'staff_details' in account_data:
                        staff_data = account_data['staff_details']
                        staff_details, staff_created = StaffDetails.objects.get_or_create(
                            user=user,
                            defaults=staff_data
                        )
                        
                        if not staff_created and options['reset']:
                            # Update existing staff details
                            for key, value in staff_data.items():
                                setattr(staff_details, key, value)
                            staff_details.save()
                            self.stdout.write(f"  ↻ Updated staff details for {email}")
                        elif staff_created:
                            self.stdout.write(f"  ✓ Created staff details for {email}")
                        else:
                            self.stdout.write(f"  ⚠ Staff details exist for {email}")
                    
            except Exception as e:
                self.stdout.write(f"✗ Error creating {email}: {str(e)}")
        
        self.stdout.write("")
        self.stdout.write("=" * 40)
        self.stdout.write("ACCOUNT SETUP SUMMARY")
        self.stdout.write("=" * 40)
        self.stdout.write(f"Accounts Created: {created_count}")
        self.stdout.write(f"Accounts Updated: {updated_count}")
        self.stdout.write("")
        
        # Verify the created accounts
        self.stdout.write("DEFAULT LOGIN CREDENTIALS:")
        self.stdout.write("─" * 40)
        
        for account_data in default_accounts:
            email = account_data['email']
            password = account_data['password']
            user_type = account_data['user_type']
            
            self.stdout.write(f"{user_type.upper()}: {email}")
            self.stdout.write(f"  Password: {password}")
            
            try:
                user = CustomUser.objects.get(email=email)
                self.stdout.write(f"  Status: {'✓ Active' if user.is_email_verified else '⚠ Unverified'}")
                self.stdout.write(f"  Staff Privileges: {'✓ Yes' if user.is_staff else '✗ No'}")
                if user.user_type in ['staff', 'admin']:
                    try:
                        staff_details = user.staff_details
                        self.stdout.write(f"  Position: {staff_details.position}")
                    except StaffDetails.DoesNotExist:
                        self.stdout.write(f"  Position: ⚠ Missing staff details")
            except CustomUser.DoesNotExist:
                self.stdout.write(f"  Status: ✗ Not found")
            
            self.stdout.write("")
        
        self.stdout.write("=" * 60)
        self.stdout.write("SETUP COMPLETE")
        
        # Show total accounts
        total_accounts = CustomUser.objects.count()
        admin_count = CustomUser.objects.filter(user_type='admin').count()
        staff_count = CustomUser.objects.filter(user_type='staff').count()
        student_count = CustomUser.objects.filter(user_type='student').count()
        
        self.stdout.write(f"Total System Accounts: {total_accounts}")
        self.stdout.write(f"  - Admin: {admin_count}")
        self.stdout.write(f"  - Staff: {staff_count}")
        self.stdout.write(f"  - Students: {student_count}")
        self.stdout.write("=" * 60)
