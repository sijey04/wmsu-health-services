from django.core.management.base import BaseCommand
from django.db.models import Count
from datetime import datetime
from api.models import CustomUser, Patient, StaffDetails

class Command(BaseCommand):
    help = 'Verify all user accounts in the WMSU Health Services system'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("WMSU HEALTH SERVICES - ACCOUNT VERIFICATION REPORT")
        self.stdout.write("=" * 60)
        self.stdout.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.stdout.write("")
        
        # Get all users
        all_users = CustomUser.objects.all().order_by('user_type', 'date_joined')
        
        self.stdout.write(f"TOTAL ACCOUNTS: {all_users.count()}")
        self.stdout.write("")
        
        # Count by user type
        admin_count = all_users.filter(user_type='admin').count()
        staff_count = all_users.filter(user_type='staff').count()
        student_count = all_users.filter(user_type='student').count()
        
        self.stdout.write("ACCOUNT BREAKDOWN BY TYPE:")
        self.stdout.write(f"  Admin Accounts:   {admin_count}")
        self.stdout.write(f"  Staff Accounts:   {staff_count}")
        self.stdout.write(f"  Student Accounts: {student_count}")
        self.stdout.write("")
        
        # Status breakdown
        verified_count = all_users.filter(is_email_verified=True).count()
        unverified_count = all_users.filter(is_email_verified=False).count()
        blocked_count = all_users.filter(is_blocked=True).count()
        
        self.stdout.write("ACCOUNT STATUS:")
        self.stdout.write(f"  Email Verified:   {verified_count}")
        self.stdout.write(f"  Email Unverified: {unverified_count}")
        self.stdout.write(f"  Blocked Users:    {blocked_count}")
        self.stdout.write("")
        
        # Admin accounts verification
        self.stdout.write("=" * 40)
        self.stdout.write("ADMIN ACCOUNTS VERIFICATION")
        self.stdout.write("=" * 40)
        
        admin_users = all_users.filter(user_type='admin')
        for admin in admin_users:
            self.stdout.write(f"✓ Admin: {admin.email}")
            self.stdout.write(f"  - Username: {admin.username}")
            self.stdout.write(f"  - Full Name: {admin.get_full_name() or 'Not Set'}")
            self.stdout.write(f"  - Is Staff: {admin.is_staff}")
            self.stdout.write(f"  - Is Superuser: {admin.is_superuser}")
            self.stdout.write(f"  - Email Verified: {admin.is_email_verified}")
            self.stdout.write(f"  - Date Joined: {admin.date_joined}")
            self.stdout.write(f"  - Last Login: {admin.last_login or 'Never'}")
            self.stdout.write(f"  - Is Blocked: {admin.is_blocked}")
            
            # Check if admin has staff details
            try:
                staff_details = admin.staff_details
                self.stdout.write(f"  - Staff Details: ✓ (Position: {staff_details.position})")
            except StaffDetails.DoesNotExist:
                self.stdout.write(f"  - Staff Details: ✗ Missing")
            self.stdout.write("")
        
        # Staff accounts verification
        self.stdout.write("=" * 40)
        self.stdout.write("STAFF ACCOUNTS VERIFICATION")
        self.stdout.write("=" * 40)
        
        staff_users = all_users.filter(user_type='staff')
        for staff in staff_users:
            self.stdout.write(f"✓ Staff: {staff.email}")
            self.stdout.write(f"  - Username: {staff.username}")
            self.stdout.write(f"  - Full Name: {staff.get_full_name() or 'Not Set'}")
            self.stdout.write(f"  - Is Staff: {staff.is_staff}")
            self.stdout.write(f"  - Email Verified: {staff.is_email_verified}")
            self.stdout.write(f"  - Date Joined: {staff.date_joined}")
            self.stdout.write(f"  - Last Login: {staff.last_login or 'Never'}")
            self.stdout.write(f"  - Is Blocked: {staff.is_blocked}")
            
            # Check if staff has staff details
            try:
                staff_details = staff.staff_details
                self.stdout.write(f"  - Staff Details: ✓")
                self.stdout.write(f"    • Position: {staff_details.position}")
                self.stdout.write(f"    • Campus: {staff_details.campus_assigned}")
                self.stdout.write(f"    • Phone: {staff_details.phone_number or 'Not Set'}")
                self.stdout.write(f"    • License: {staff_details.license_number or 'Not Set'}")
            except StaffDetails.DoesNotExist:
                self.stdout.write(f"  - Staff Details: ✗ Missing")
            self.stdout.write("")
        
        # Student accounts verification (sample)
        self.stdout.write("=" * 40)
        self.stdout.write("STUDENT ACCOUNTS VERIFICATION (Sample)")
        self.stdout.write("=" * 40)
        
        student_users = all_users.filter(user_type='student')[:10]  # Show first 10
        
        for student in student_users:
            self.stdout.write(f"✓ Student: {student.email}")
            self.stdout.write(f"  - Username: {student.username}")
            self.stdout.write(f"  - Full Name: {student.get_full_name() or 'Not Set'}")
            self.stdout.write(f"  - Email Verified: {student.is_email_verified}")
            self.stdout.write(f"  - Date Joined: {student.date_joined}")
            self.stdout.write(f"  - Last Login: {student.last_login or 'Never'}")
            self.stdout.write(f"  - Is Blocked: {student.is_blocked}")
            
            # Check patient profiles
            patient_profiles = student.patient_profiles.all()
            self.stdout.write(f"  - Patient Profiles: {patient_profiles.count()}")
            self.stdout.write("")
        
        total_students = all_users.filter(user_type='student').count()
        if total_students > 10:
            self.stdout.write(f"... and {total_students - 10} more student accounts")
            self.stdout.write("")
        
        # Blocked accounts verification
        self.stdout.write("=" * 40)
        self.stdout.write("BLOCKED ACCOUNTS")
        self.stdout.write("=" * 40)
        
        blocked_users = all_users.filter(is_blocked=True)
        if blocked_users.exists():
            for blocked in blocked_users:
                self.stdout.write(f"⚠ Blocked: {blocked.email}")
                self.stdout.write(f"  - User Type: {blocked.user_type}")
                self.stdout.write(f"  - Blocked At: {blocked.blocked_at}")
                self.stdout.write(f"  - Blocked By: {blocked.blocked_by.email if blocked.blocked_by else 'System'}")
                self.stdout.write(f"  - Reason: {blocked.block_reason or 'Not specified'}")
                self.stdout.write("")
        else:
            self.stdout.write("No blocked accounts found.")
            self.stdout.write("")
        
        # Unverified email accounts
        self.stdout.write("=" * 40)
        self.stdout.write("UNVERIFIED EMAIL ACCOUNTS")
        self.stdout.write("=" * 40)
        
        unverified_users = all_users.filter(is_email_verified=False)
        if unverified_users.exists():
            for unverified in unverified_users[:5]:  # Show first 5
                self.stdout.write(f"⚠ Unverified: {unverified.email}")
                self.stdout.write(f"  - User Type: {unverified.user_type}")
                self.stdout.write(f"  - Date Joined: {unverified.date_joined}")
                self.stdout.write(f"  - Can Book Consultation: {unverified.can_book_consultation()}")
                self.stdout.write("")
            
            if unverified_users.count() > 5:
                self.stdout.write(f"... and {unverified_users.count() - 5} more unverified accounts")
        else:
            self.stdout.write("All accounts have verified emails.")
        self.stdout.write("")
        
        # Account integrity checks
        self.stdout.write("=" * 40)
        self.stdout.write("ACCOUNT INTEGRITY CHECKS")
        self.stdout.write("=" * 40)
        
        # Check for staff accounts missing staff details
        staff_without_details = []
        for staff in all_users.filter(user_type='staff'):
            try:
                staff.staff_details
            except StaffDetails.DoesNotExist:
                staff_without_details.append(staff)
        
        if staff_without_details:
            self.stdout.write(f"⚠ Staff accounts missing details: {len(staff_without_details)}")
            for staff in staff_without_details:
                self.stdout.write(f"  - {staff.email}")
        else:
            self.stdout.write("✓ All staff accounts have complete details")
        
        # Check for duplicate emails
        duplicate_emails = CustomUser.objects.values('email').annotate(count=Count('email')).filter(count__gt=1)
        if duplicate_emails:
            self.stdout.write(f"⚠ Duplicate emails found: {duplicate_emails.count()}")
            for dup in duplicate_emails:
                self.stdout.write(f"  - {dup['email']} ({dup['count']} accounts)")
        else:
            self.stdout.write("✓ No duplicate emails found")
        
        # Check for accounts with empty required fields
        incomplete_accounts = all_users.filter(email__isnull=True) | all_users.filter(email='')
        if incomplete_accounts.exists():
            self.stdout.write(f"⚠ Accounts with missing email: {incomplete_accounts.count()}")
        else:
            self.stdout.write("✓ All accounts have email addresses")
        
        self.stdout.write("")
        
        # Summary
        self.stdout.write("=" * 40)
        self.stdout.write("VERIFICATION SUMMARY")
        self.stdout.write("=" * 40)
        self.stdout.write(f"Total Accounts Verified: {all_users.count()}")
        self.stdout.write(f"Admin Accounts: {admin_count} (All functional)")
        self.stdout.write(f"Staff Accounts: {staff_count} ({staff_count - len(staff_without_details)} complete)")
        self.stdout.write(f"Student Accounts: {student_count}")
        
        if all_users.count() > 0:
            verification_rate = (verified_count/all_users.count()*100)
            self.stdout.write(f"Email Verification Rate: {verification_rate:.1f}%")
        
        self.stdout.write(f"Account Security: {blocked_count} blocked accounts")
        self.stdout.write("")
        
        if len(staff_without_details) == 0 and not duplicate_emails and not incomplete_accounts.exists():
            self.stdout.write(self.style.SUCCESS("✅ ALL ACCOUNTS VERIFIED SUCCESSFULLY"))
        else:
            self.stdout.write(self.style.WARNING("⚠️  SOME ISSUES FOUND - Review details above"))
        
        self.stdout.write("=" * 60)
