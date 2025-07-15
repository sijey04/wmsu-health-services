from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Update existing accounts to proper admin and staff roles'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("WMSU HEALTH SERVICES - ACCOUNT ROLE UPDATE")
        self.stdout.write("=" * 60)
        
        with connection.cursor() as cursor:
            # Update the admin@example.com account to be a proper admin
            cursor.execute("""
                SELECT id FROM api_customuser WHERE username = 'admin' AND email = 'admin@example.com'
            """)
            
            admin_result = cursor.fetchone()
            if admin_result:
                admin_id = admin_result[0]
                
                # Update user to admin role
                cursor.execute("""
                    UPDATE api_customuser 
                    SET user_type = 'admin', 
                        is_staff = 1, 
                        is_superuser = 1, 
                        first_name = 'System', 
                        last_name = 'Administrator',
                        email = 'admin@wmsu.edu.ph'
                    WHERE id = %s
                """, [admin_id])
                
                # Check if staff details exist for this user
                cursor.execute("SELECT COUNT(*) FROM api_staffdetails WHERE user_id = %s", [admin_id])
                has_staff_details = cursor.fetchone()[0] > 0
                
                if not has_staff_details:
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
                    self.stdout.write("✓ Created staff details for admin")
                
                self.stdout.write("✓ Updated admin@example.com -> admin@wmsu.edu.ph as admin")
            else:
                self.stdout.write("⚠ Admin account not found")
            
            # Update the test.staff@wmsu.edu account to have proper staff privileges
            cursor.execute("""
                UPDATE api_customuser 
                SET is_staff = 1 
                WHERE email = 'test.staff@wmsu.edu' AND user_type = 'staff'
            """)
            
            if cursor.rowcount > 0:
                self.stdout.write("✓ Updated test.staff@wmsu.edu to have staff privileges")
            
            # Create a main doctor account if it doesn't exist
            cursor.execute("SELECT COUNT(*) FROM api_customuser WHERE email = 'doctor.main@wmsu.edu.ph'")
            doctor_exists = cursor.fetchone()[0] > 0
            
            if not doctor_exists:
                # Create main doctor account
                doctor_password = make_password('wmsu2024')
                
                cursor.execute("""
                    INSERT INTO api_customuser 
                    (password, last_login, is_superuser, username, first_name, last_name, 
                     email, is_staff, is_active, date_joined, grade_level, is_email_verified, 
                     email_verification_token, email_verification_sent_at, user_type, middle_name,
                     is_blocked, blocked_at, blocked_by_id, block_reason)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, UUID(), %s, %s, %s, %s, %s, %s, %s)
                """, [
                    doctor_password,
                    None,  # last_login
                    0,     # is_superuser
                    'doctor_main',
                    'Felicitas',
                    'Elago',
                    'doctor.main@wmsu.edu.ph',
                    1,     # is_staff
                    1,     # is_active
                    '',    # grade_level
                    1,     # is_email_verified
                    None,  # email_verification_sent_at
                    'staff',
                    'C.',  # middle_name
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
                
                self.stdout.write("✓ Created doctor.main@wmsu.edu.ph account")
                self.stdout.write("✓ Created doctor staff details")
            else:
                self.stdout.write("⚠ Doctor account already exists")
            
            self.stdout.write("")
            self.stdout.write("=" * 40)
            self.stdout.write("UPDATED ACCOUNT VERIFICATION")
            self.stdout.write("=" * 40)
            
            # Verify all accounts again
            cursor.execute("""
                SELECT u.email, u.username, u.user_type, u.is_staff, u.is_superuser, 
                       u.first_name, u.last_name, s.position 
                FROM api_customuser u 
                LEFT JOIN api_staffdetails s ON u.id = s.user_id 
                ORDER BY 
                    CASE u.user_type 
                        WHEN 'admin' THEN 1 
                        WHEN 'staff' THEN 2 
                        WHEN 'student' THEN 3 
                    END, u.email
            """)
            
            accounts = cursor.fetchall()
            current_type = None
            
            for account in accounts:
                email, username, user_type, is_staff, is_superuser, first_name, last_name, position = account
                
                if user_type != current_type:
                    current_type = user_type
                    self.stdout.write(f"\n{user_type.upper()} ACCOUNTS:")
                    self.stdout.write("-" * 30)
                
                full_name = f"{first_name or ''} {last_name or ''}".strip() or username
                self.stdout.write(f"✓ {email}")
                self.stdout.write(f"  - Name: {full_name}")
                self.stdout.write(f"  - Username: {username}")
                self.stdout.write(f"  - Staff: {'✓' if is_staff else '✗'}")
                self.stdout.write(f"  - Superuser: {'✓' if is_superuser else '✗'}")
                if position:
                    self.stdout.write(f"  - Position: {position}")
                self.stdout.write("")
            
            # Show final counts
            cursor.execute("SELECT user_type, COUNT(*) FROM api_customuser GROUP BY user_type ORDER BY user_type")
            type_counts = cursor.fetchall()
            
            self.stdout.write("=" * 40)
            self.stdout.write("FINAL ACCOUNT SUMMARY")
            self.stdout.write("=" * 40)
            
            total = 0
            for user_type, count in type_counts:
                self.stdout.write(f"{user_type.title()} Accounts: {count}")
                total += count
            
            self.stdout.write(f"Total Accounts: {total}")
            
            # Show default credentials
            self.stdout.write("")
            self.stdout.write("=" * 40)
            self.stdout.write("DEFAULT LOGIN CREDENTIALS")
            self.stdout.write("=" * 40)
            
            self.stdout.write("ADMIN ACCOUNT:")
            self.stdout.write("  Email: admin@wmsu.edu.ph")
            self.stdout.write("  Username: admin")
            self.stdout.write("  Password: admin123")
            self.stdout.write("")
            
            self.stdout.write("MAIN DOCTOR ACCOUNT:")
            self.stdout.write("  Email: doctor.main@wmsu.edu.ph")
            self.stdout.write("  Username: doctor_main")
            self.stdout.write("  Password: wmsu2024")
            self.stdout.write("")
            
            self.stdout.write("TEST STAFF ACCOUNT:")
            self.stdout.write("  Email: test.staff@wmsu.edu")
            self.stdout.write("  Username: teststaff")
            self.stdout.write("  Password: (unchanged)")
            
            self.stdout.write("")
            self.stdout.write("✅ ACCOUNT ROLE UPDATE COMPLETE")
            self.stdout.write("=" * 60)
