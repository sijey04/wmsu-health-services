from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Verify all user accounts using direct SQL queries'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            self.stdout.write("=" * 60)
            self.stdout.write("WMSU HEALTH SERVICES - ACCOUNT VERIFICATION REPORT")
            self.stdout.write("=" * 60)
            
            # Get basic account counts
            cursor.execute("SELECT COUNT(*) FROM api_customuser")
            total_accounts = cursor.fetchone()[0]
            
            cursor.execute("SELECT user_type, COUNT(*) FROM api_customuser GROUP BY user_type")
            type_counts = cursor.fetchall()
            
            self.stdout.write(f"TOTAL ACCOUNTS: {total_accounts}")
            self.stdout.write("")
            self.stdout.write("ACCOUNT BREAKDOWN BY TYPE:")
            
            admin_count = 0
            staff_count = 0
            student_count = 0
            
            for user_type, count in type_counts:
                if user_type == 'admin':
                    admin_count = count
                elif user_type == 'staff':
                    staff_count = count
                elif user_type == 'student':
                    student_count = count
                self.stdout.write(f"  {user_type.title()} Accounts: {count}")
            
            self.stdout.write("")
            
            # Email verification status
            cursor.execute("SELECT is_email_verified, COUNT(*) FROM api_customuser GROUP BY is_email_verified")
            verification_counts = cursor.fetchall()
            
            verified_count = 0
            unverified_count = 0
            for is_verified, count in verification_counts:
                if is_verified:
                    verified_count = count
                else:
                    unverified_count = count
            
            self.stdout.write("ACCOUNT STATUS:")
            self.stdout.write(f"  Email Verified:   {verified_count}")
            self.stdout.write(f"  Email Unverified: {unverified_count}")
            
            # Blocked users
            cursor.execute("SELECT COUNT(*) FROM api_customuser WHERE is_blocked = 1")
            blocked_count = cursor.fetchone()[0]
            self.stdout.write(f"  Blocked Users:    {blocked_count}")
            self.stdout.write("")
            
            # Admin accounts details
            self.stdout.write("=" * 40)
            self.stdout.write("ADMIN ACCOUNTS VERIFICATION")
            self.stdout.write("=" * 40)
            
            cursor.execute("""
                SELECT id, email, username, first_name, last_name, is_staff, is_superuser, 
                       is_email_verified, date_joined, last_login, is_blocked
                FROM api_customuser WHERE user_type = 'admin'
            """)
            
            admin_users = cursor.fetchall()
            for admin in admin_users:
                (user_id, email, username, first_name, last_name, is_staff, is_superuser, 
                 is_email_verified, date_joined, last_login, is_blocked) = admin
                
                full_name = f"{first_name or ''} {last_name or ''}".strip() or 'Not Set'
                
                self.stdout.write(f"✓ Admin: {email}")
                self.stdout.write(f"  - Username: {username}")
                self.stdout.write(f"  - Full Name: {full_name}")
                self.stdout.write(f"  - Is Staff: {bool(is_staff)}")
                self.stdout.write(f"  - Is Superuser: {bool(is_superuser)}")
                self.stdout.write(f"  - Email Verified: {bool(is_email_verified)}")
                self.stdout.write(f"  - Date Joined: {date_joined}")
                self.stdout.write(f"  - Last Login: {last_login or 'Never'}")
                self.stdout.write(f"  - Is Blocked: {bool(is_blocked)}")
                
                # Check for staff details
                cursor.execute("SELECT position, campus_assigned FROM api_staffdetails WHERE user_id = %s", [user_id])
                staff_details = cursor.fetchone()
                if staff_details:
                    position, campus = staff_details
                    self.stdout.write(f"  - Staff Details: ✓ (Position: {position})")
                else:
                    self.stdout.write(f"  - Staff Details: ✗ Missing")
                self.stdout.write("")
            
            if not admin_users:
                self.stdout.write("No admin accounts found.")
                self.stdout.write("")
            
            # Staff accounts details
            self.stdout.write("=" * 40)
            self.stdout.write("STAFF ACCOUNTS VERIFICATION")
            self.stdout.write("=" * 40)
            
            cursor.execute("""
                SELECT id, email, username, first_name, last_name, is_staff, 
                       is_email_verified, date_joined, last_login, is_blocked
                FROM api_customuser WHERE user_type = 'staff'
            """)
            
            staff_users = cursor.fetchall()
            for staff in staff_users:
                (user_id, email, username, first_name, last_name, is_staff, 
                 is_email_verified, date_joined, last_login, is_blocked) = staff
                
                full_name = f"{first_name or ''} {last_name or ''}".strip() or 'Not Set'
                
                self.stdout.write(f"✓ Staff: {email}")
                self.stdout.write(f"  - Username: {username}")
                self.stdout.write(f"  - Full Name: {full_name}")
                self.stdout.write(f"  - Is Staff: {bool(is_staff)}")
                self.stdout.write(f"  - Email Verified: {bool(is_email_verified)}")
                self.stdout.write(f"  - Date Joined: {date_joined}")
                self.stdout.write(f"  - Last Login: {last_login or 'Never'}")
                self.stdout.write(f"  - Is Blocked: {bool(is_blocked)}")
                
                # Check for staff details
                cursor.execute("""
                    SELECT position, campus_assigned, phone_number, license_number 
                    FROM api_staffdetails WHERE user_id = %s
                """, [user_id])
                staff_details = cursor.fetchone()
                if staff_details:
                    position, campus, phone, license = staff_details
                    self.stdout.write(f"  - Staff Details: ✓")
                    self.stdout.write(f"    • Position: {position}")
                    self.stdout.write(f"    • Campus: {campus}")
                    self.stdout.write(f"    • Phone: {phone or 'Not Set'}")
                    self.stdout.write(f"    • License: {license or 'Not Set'}")
                else:
                    self.stdout.write(f"  - Staff Details: ✗ Missing")
                self.stdout.write("")
            
            # Student accounts sample
            self.stdout.write("=" * 40)
            self.stdout.write("STUDENT ACCOUNTS VERIFICATION (Sample)")
            self.stdout.write("=" * 40)
            
            cursor.execute("""
                SELECT id, email, username, first_name, last_name, 
                       is_email_verified, date_joined, last_login, is_blocked
                FROM api_customuser WHERE user_type = 'student' LIMIT 10
            """)
            
            student_users = cursor.fetchall()
            for student in student_users:
                (user_id, email, username, first_name, last_name, 
                 is_email_verified, date_joined, last_login, is_blocked) = student
                
                full_name = f"{first_name or ''} {last_name or ''}".strip() or 'Not Set'
                
                self.stdout.write(f"✓ Student: {email}")
                self.stdout.write(f"  - Username: {username}")
                self.stdout.write(f"  - Full Name: {full_name}")
                self.stdout.write(f"  - Email Verified: {bool(is_email_verified)}")
                self.stdout.write(f"  - Date Joined: {date_joined}")
                self.stdout.write(f"  - Last Login: {last_login or 'Never'}")
                self.stdout.write(f"  - Is Blocked: {bool(is_blocked)}")
                
                # Check patient profiles
                cursor.execute("SELECT COUNT(*) FROM api_patient WHERE user_id = %s", [user_id])
                profile_count = cursor.fetchone()[0]
                self.stdout.write(f"  - Patient Profiles: {profile_count}")
                self.stdout.write("")
            
            if student_count > 10:
                self.stdout.write(f"... and {student_count - 10} more student accounts")
                self.stdout.write("")
            
            # Blocked accounts
            self.stdout.write("=" * 40)
            self.stdout.write("BLOCKED ACCOUNTS")
            self.stdout.write("=" * 40)
            
            if blocked_count > 0:
                cursor.execute("""
                    SELECT email, user_type, blocked_at, block_reason
                    FROM api_customuser WHERE is_blocked = 1
                """)
                blocked_users = cursor.fetchall()
                for blocked in blocked_users:
                    email, user_type, blocked_at, block_reason = blocked
                    self.stdout.write(f"⚠ Blocked: {email}")
                    self.stdout.write(f"  - User Type: {user_type}")
                    self.stdout.write(f"  - Blocked At: {blocked_at}")
                    self.stdout.write(f"  - Reason: {block_reason or 'Not specified'}")
                    self.stdout.write("")
            else:
                self.stdout.write("No blocked accounts found.")
                self.stdout.write("")
            
            # Unverified emails
            self.stdout.write("=" * 40)
            self.stdout.write("UNVERIFIED EMAIL ACCOUNTS")
            self.stdout.write("=" * 40)
            
            if unverified_count > 0:
                cursor.execute("""
                    SELECT email, user_type, date_joined
                    FROM api_customuser WHERE is_email_verified = 0 LIMIT 5
                """)
                unverified_users = cursor.fetchall()
                for unverified in unverified_users:
                    email, user_type, date_joined = unverified
                    self.stdout.write(f"⚠ Unverified: {email}")
                    self.stdout.write(f"  - User Type: {user_type}")
                    self.stdout.write(f"  - Date Joined: {date_joined}")
                    self.stdout.write("")
                
                if unverified_count > 5:
                    self.stdout.write(f"... and {unverified_count - 5} more unverified accounts")
            else:
                self.stdout.write("All accounts have verified emails.")
            self.stdout.write("")
            
            # Integrity checks
            self.stdout.write("=" * 40)
            self.stdout.write("ACCOUNT INTEGRITY CHECKS")
            self.stdout.write("=" * 40)
            
            # Staff without details
            cursor.execute("""
                SELECT u.email FROM api_customuser u 
                LEFT JOIN api_staffdetails s ON u.id = s.user_id 
                WHERE u.user_type = 'staff' AND s.id IS NULL
            """)
            staff_without_details = cursor.fetchall()
            
            if staff_without_details:
                self.stdout.write(f"⚠ Staff accounts missing details: {len(staff_without_details)}")
                for staff in staff_without_details:
                    self.stdout.write(f"  - {staff[0]}")
            else:
                self.stdout.write("✓ All staff accounts have complete details")
            
            # Duplicate emails
            cursor.execute("""
                SELECT email, COUNT(*) as count FROM api_customuser 
                GROUP BY email HAVING COUNT(*) > 1
            """)
            duplicate_emails = cursor.fetchall()
            
            if duplicate_emails:
                self.stdout.write(f"⚠ Duplicate emails found: {len(duplicate_emails)}")
                for email, count in duplicate_emails:
                    self.stdout.write(f"  - {email} ({count} accounts)")
            else:
                self.stdout.write("✓ No duplicate emails found")
            
            # Empty emails
            cursor.execute("SELECT COUNT(*) FROM api_customuser WHERE email IS NULL OR email = ''")
            empty_emails = cursor.fetchone()[0]
            
            if empty_emails > 0:
                self.stdout.write(f"⚠ Accounts with missing email: {empty_emails}")
            else:
                self.stdout.write("✓ All accounts have email addresses")
            
            self.stdout.write("")
            
            # Summary
            self.stdout.write("=" * 40)
            self.stdout.write("VERIFICATION SUMMARY")
            self.stdout.write("=" * 40)
            self.stdout.write(f"Total Accounts Verified: {total_accounts}")
            self.stdout.write(f"Admin Accounts: {admin_count}")
            self.stdout.write(f"Staff Accounts: {staff_count} ({staff_count - len(staff_without_details)} complete)")
            self.stdout.write(f"Student Accounts: {student_count}")
            
            if total_accounts > 0:
                verification_rate = (verified_count/total_accounts*100)
                self.stdout.write(f"Email Verification Rate: {verification_rate:.1f}%")
            
            self.stdout.write(f"Account Security: {blocked_count} blocked accounts")
            self.stdout.write("")
            
            issues_found = len(staff_without_details) > 0 or len(duplicate_emails) > 0 or empty_emails > 0
            
            if not issues_found:
                self.stdout.write(self.style.SUCCESS("✅ ALL ACCOUNTS VERIFIED SUCCESSFULLY"))
            else:
                self.stdout.write(self.style.WARNING("⚠️  SOME ISSUES FOUND - Review details above"))
            
            self.stdout.write("=" * 60)
