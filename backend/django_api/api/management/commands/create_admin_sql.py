from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth.hashers import make_password
import uuid

class Command(BaseCommand):
    help = 'Create default admin account using raw SQL'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("WMSU HEALTH SERVICES - ADMIN ACCOUNT SETUP")
        self.stdout.write("=" * 60)
        
        with connection.cursor() as cursor:
            # Check if admin account exists
            cursor.execute("SELECT COUNT(*) FROM api_customuser WHERE email = 'admin@wmsu.edu.ph'")
            admin_exists = cursor.fetchone()[0] > 0
            
            if not admin_exists:
                # Create admin account
                admin_data = {
                    'password': make_password('admin123'),
                    'last_login': None,
                    'is_superuser': 1,
                    'username': 'admin',
                    'first_name': 'System',
                    'last_name': 'Administrator',
                    'email': 'admin@wmsu.edu.ph',
                    'is_staff': 1,
                    'is_active': 1,
                    'date_joined': 'NOW()',
                    'grade_level': '',
                    'is_email_verified': 1,
                    'email_verification_token': str(uuid.uuid4()),
                    'email_verification_sent_at': None,
                    'user_type': 'admin',
                    'middle_name': '',
                    'is_blocked': 0,
                    'blocked_at': None,
                    'blocked_by_id': None,
                    'block_reason': ''
                }
                
                # Insert admin user
                cursor.execute("""
                    INSERT INTO api_customuser 
                    (password, last_login, is_superuser, username, first_name, last_name, 
                     email, is_staff, is_active, date_joined, grade_level, is_email_verified, 
                     email_verification_token, email_verification_sent_at, user_type, middle_name,
                     is_blocked, blocked_at, blocked_by_id, block_reason)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, [
                    admin_data['password'],
                    admin_data['last_login'],
                    admin_data['is_superuser'],
                    admin_data['username'],
                    admin_data['first_name'],
                    admin_data['last_name'],
                    admin_data['email'],
                    admin_data['is_staff'],
                    admin_data['is_active'],
                    admin_data['grade_level'],
                    admin_data['is_email_verified'],
                    admin_data['email_verification_token'],
                    admin_data['email_verification_sent_at'],
                    admin_data['user_type'],
                    admin_data['middle_name'],
                    admin_data['is_blocked'],
                    admin_data['blocked_at'],
                    admin_data['blocked_by_id'],
                    admin_data['block_reason']
                ])
                
                # Get the admin user ID
                cursor.execute("SELECT id FROM api_customuser WHERE email = 'admin@wmsu.edu.ph'")
                admin_id = cursor.fetchone()[0]
                
                # Create staff details for admin
                cursor.execute("""
                    INSERT INTO api_staffdetails 
                    (user_id, signature, full_name, position, license_number, ptr_number, 
                     campus_assigned, assigned_campuses, phone_number, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, [
                    admin_id,
                    '',  # signature
                    'System Administrator',
                    'System Administrator',
                    '',  # license_number
                    '',  # ptr_number
                    'a',  # campus_assigned
                    'a',  # assigned_campuses
                    ''   # phone_number
                ])
                
                self.stdout.write("✓ Created admin account: admin@wmsu.edu.ph")
                self.stdout.write("✓ Created admin staff details")
            else:
                self.stdout.write("⚠ Admin account already exists: admin@wmsu.edu.ph")
            
            # Check if we need to create a main doctor account
            cursor.execute("SELECT COUNT(*) FROM api_customuser WHERE email = 'doctor.main@wmsu.edu.ph'")
            doctor_exists = cursor.fetchone()[0] > 0
            
            if not doctor_exists:
                # Create main doctor account
                doctor_data = {
                    'password': make_password('wmsu2024'),
                    'username': 'doctor_main',
                    'first_name': 'Felicitas',
                    'last_name': 'Elago',
                    'middle_name': 'C.',
                    'email': 'doctor.main@wmsu.edu.ph',
                    'user_type': 'staff',
                    'email_verification_token': str(uuid.uuid4())
                }
                
                cursor.execute("""
                    INSERT INTO api_customuser 
                    (password, last_login, is_superuser, username, first_name, last_name, 
                     email, is_staff, is_active, date_joined, grade_level, is_email_verified, 
                     email_verification_token, email_verification_sent_at, user_type, middle_name,
                     is_blocked, blocked_at, blocked_by_id, block_reason)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, [
                    doctor_data['password'],
                    None,  # last_login
                    0,     # is_superuser
                    doctor_data['username'],
                    doctor_data['first_name'],
                    doctor_data['last_name'],
                    doctor_data['email'],
                    1,     # is_staff
                    1,     # is_active
                    '',    # grade_level
                    1,     # is_email_verified
                    doctor_data['email_verification_token'],
                    None,  # email_verification_sent_at
                    doctor_data['user_type'],
                    doctor_data['middle_name'],
                    0,     # is_blocked
                    None,  # blocked_at
                    None,  # blocked_by_id
                    ''     # block_reason
                ])
                
                # Get the doctor user ID
                cursor.execute("SELECT id FROM api_customuser WHERE email = 'doctor.main@wmsu.edu.ph'")
                doctor_id = cursor.fetchone()[0]
                
                # Create staff details for doctor
                cursor.execute("""
                    INSERT INTO api_staffdetails 
                    (user_id, signature, full_name, position, license_number, ptr_number, 
                     campus_assigned, assigned_campuses, phone_number, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, [
                    doctor_id,
                    '',  # signature
                    'Dr. Felicitas C. Elago',
                    'Chief Medical Officer',
                    'MD-12345',
                    '',  # ptr_number
                    'a',  # campus_assigned
                    'a',  # assigned_campuses
                    '+639123456789'
                ])
                
                self.stdout.write("✓ Created doctor account: doctor.main@wmsu.edu.ph")
                self.stdout.write("✓ Created doctor staff details")
            else:
                self.stdout.write("⚠ Doctor account already exists: doctor.main@wmsu.edu.ph")
            
            self.stdout.write("")
            self.stdout.write("=" * 40)
            self.stdout.write("DEFAULT LOGIN CREDENTIALS")
            self.stdout.write("=" * 40)
            
            # Verify created accounts
            cursor.execute("""
                SELECT u.email, u.username, u.user_type, u.is_staff, u.is_superuser, 
                       u.is_email_verified, s.position 
                FROM api_customuser u 
                LEFT JOIN api_staffdetails s ON u.id = s.user_id 
                WHERE u.email IN ('admin@wmsu.edu.ph', 'doctor.main@wmsu.edu.ph')
                ORDER BY u.user_type
            """)
            
            accounts = cursor.fetchall()
            for account in accounts:
                email, username, user_type, is_staff, is_superuser, is_verified, position = account
                password = 'admin123' if user_type == 'admin' else 'wmsu2024'
                
                self.stdout.write(f"{user_type.upper()}: {email}")
                self.stdout.write(f"  Username: {username}")
                self.stdout.write(f"  Password: {password}")
                self.stdout.write(f"  Status: {'✓ Active' if is_verified else '⚠ Unverified'}")
                self.stdout.write(f"  Staff: {'✓ Yes' if is_staff else '✗ No'}")
                self.stdout.write(f"  Superuser: {'✓ Yes' if is_superuser else '✗ No'}")
                if position:
                    self.stdout.write(f"  Position: {position}")
                self.stdout.write("")
            
            # Show total counts
            cursor.execute("SELECT user_type, COUNT(*) FROM api_customuser GROUP BY user_type")
            type_counts = cursor.fetchall()
            
            self.stdout.write("=" * 40)
            self.stdout.write("ACCOUNT SUMMARY")
            self.stdout.write("=" * 40)
            
            for user_type, count in type_counts:
                self.stdout.write(f"{user_type.title()} Accounts: {count}")
            
            cursor.execute("SELECT COUNT(*) FROM api_customuser")
            total = cursor.fetchone()[0]
            self.stdout.write(f"Total Accounts: {total}")
            
            self.stdout.write("")
            self.stdout.write("✅ ACCOUNT SETUP COMPLETE")
            self.stdout.write("=" * 60)
