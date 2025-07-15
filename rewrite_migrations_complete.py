#!/usr/bin/env python
"""
Complete Migration Rewrite Script
This script will backup existing migrations and create new ones that exactly match the SQL file
"""

import os
import sys
import shutil
import django
from datetime import datetime

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

def backup_existing_migrations():
    """Create a backup of all existing migrations"""
    migrations_dir = 'api/migrations'
    backup_dir = f'api/migrations/backup_before_rewrite_{int(datetime.now().timestamp())}'
    
    if os.path.exists(migrations_dir):
        # Create backup directory
        os.makedirs(backup_dir, exist_ok=True)
        
        # Copy all migration files
        for file in os.listdir(migrations_dir):
            if file.endswith('.py') and file != '__init__.py':
                shutil.copy2(
                    os.path.join(migrations_dir, file),
                    os.path.join(backup_dir, file)
                )
        
        print(f"✓ Backed up existing migrations to: {backup_dir}")
        return backup_dir
    
    return None

def clear_migrations_table():
    """Clear all migration records from django_migrations table"""
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Delete all migration records for the api app
        cursor.execute("DELETE FROM django_migrations WHERE app = 'api'")
        print("✓ Cleared migration records from database")

def create_initial_migration():
    """Create a comprehensive initial migration that matches the SQL file exactly"""
    
    migration_content = '''# Generated initial migration to match SQL file structure
# Date: 2025-07-16

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        # Create CustomUser model
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(max_length=150, unique=True, verbose_name='username')),
                ('first_name', models.CharField(max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(auto_now_add=True, verbose_name='date joined')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('grade_level', models.CharField(blank=True, max_length=50, null=True)),
                ('is_email_verified', models.BooleanField(default=False)),
                ('email_verification_token', models.UUIDField(blank=True, null=True)),
                ('email_verification_sent_at', models.DateTimeField(blank=True, null=True)),
                ('user_type', models.CharField(choices=[('student', 'Student'), ('staff', 'Staff'), ('admin', 'Admin')], default='student', max_length=10)),
                ('middle_name', models.CharField(blank=True, max_length=150, null=True)),
                ('blocked_at', models.DateTimeField(blank=True, null=True)),
                ('blocked_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='blocked_users', to=settings.AUTH_USER_MODEL)),
                ('block_reason', models.TextField(blank=True, null=True)),
                ('is_blocked', models.BooleanField(default=False)),
                ('education_level', models.CharField(blank=True, max_length=20, null=True)),
                ('education_year', models.IntegerField(blank=True, null=True)),
                ('education_program', models.CharField(blank=True, max_length=200, null=True)),
                ('department_college', models.CharField(blank=True, max_length=200, null=True)),
                ('employee_position', models.CharField(blank=True, max_length=200, null=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'db_table': 'api_customuser',
            },
        ),
        
        # Create AcademicSchoolYear model
        migrations.CreateModel(
            name='AcademicSchoolYear',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.CharField(help_text='Academic year in format YYYY-YYYY', max_length=20, unique=True)),
                ('start_date', models.DateField(help_text='Start date of academic year')),
                ('end_date', models.DateField(help_text='End date of academic year')),
                ('is_current', models.BooleanField(default=False, help_text='Whether this is the current academic year')),
                ('status', models.CharField(choices=[('upcoming', 'Upcoming'), ('active', 'Active'), ('completed', 'Completed')], default='upcoming', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('first_sem_start', models.DateField(blank=True, help_text='First semester start date', null=True)),
                ('first_sem_end', models.DateField(blank=True, help_text='First semester end date', null=True)),
                ('second_sem_start', models.DateField(blank=True, help_text='Second semester start date', null=True)),
                ('second_sem_end', models.DateField(blank=True, help_text='Second semester end date', null=True)),
                ('summer_start', models.DateField(blank=True, help_text='Summer semester start date', null=True)),
                ('summer_end', models.DateField(blank=True, help_text='Summer semester end date', null=True)),
            ],
            options={
                'db_table': 'api_academicschoolyear',
                'ordering': ['-academic_year'],
            },
        ),
        
        # Create Patient model with complete field structure
        migrations.CreateModel(
            name='Patient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_id', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=100)),
                ('gender', models.CharField(choices=[('Male', 'Male'), ('Female', 'Female')], max_length=10)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('age', models.IntegerField(blank=True, null=True)),
                ('department', models.CharField(blank=True, max_length=100, null=True)),
                ('contact_number', models.CharField(blank=True, max_length=20, null=True)),
                ('address', models.TextField(blank=True, null=True)),
                ('emergency_contact_first_name', models.CharField(blank=True, max_length=100, null=True)),
                ('emergency_contact_number', models.CharField(blank=True, max_length=20, null=True)),
                ('blood_type', models.CharField(blank=True, choices=[('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-')], max_length=5, null=True)),
                ('allergies', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='patient_profiles', to=settings.AUTH_USER_MODEL)),
                ('civil_status', models.CharField(blank=True, choices=[('single', 'Single'), ('married', 'Married'), ('widowed', 'Widowed'), ('divorced', 'Divorced')], max_length=20, null=True)),
                ('comorbid_illnesses', models.JSONField(blank=True, default=list, help_text='List of current comorbid illnesses')),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('emergency_contact_address', models.TextField(blank=True, null=True)),
                ('emergency_contact_middle_name', models.CharField(blank=True, max_length=100, null=True)),
                ('emergency_contact_relationship', models.CharField(blank=True, max_length=50, null=True)),
                ('emergency_contact_surname', models.CharField(blank=True, max_length=100, null=True)),
                ('family_medical_history', models.JSONField(blank=True, default=list, help_text='List of family medical history')),
                ('first_name', models.CharField(blank=True, max_length=100, null=True)),
                ('hospital_admission_or_surgery', models.BooleanField(default=False)),
                ('maintenance_medications', models.JSONField(blank=True, default=list, help_text='List of maintenance medications')),
                ('middle_name', models.CharField(blank=True, max_length=100, null=True)),
                ('nationality', models.CharField(blank=True, max_length=50, null=True)),
                ('past_medical_history', models.JSONField(blank=True, default=list, help_text='List of past medical history')),
                ('photo', models.ImageField(blank=True, null=True, upload_to='patient_photos/')),
                ('religion', models.CharField(blank=True, max_length=50, null=True)),
                ('suffix', models.CharField(blank=True, max_length=20, null=True)),
                ('barangay', models.CharField(blank=True, max_length=100, null=True)),
                ('city_municipality', models.CharField(blank=True, max_length=100, null=True)),
                ('street', models.CharField(blank=True, max_length=200, null=True)),
                ('emergency_contact_barangay', models.CharField(blank=True, max_length=100, null=True)),
                ('emergency_contact_street', models.CharField(blank=True, max_length=200, null=True)),
                ('school_year', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.academicschoolyear')),
                ('vaccination_history', models.JSONField(blank=True, default=dict, help_text='Vaccination history and status')),
                ('hospital_admission_details', models.TextField(blank=True, help_text='Details of hospital admission or surgery when answer is Yes', null=True)),
                ('surname', models.CharField(blank=True, max_length=100, null=True)),
                ('sex', models.CharField(blank=True, choices=[('Male', 'Male'), ('Female', 'Female')], max_length=10, null=True)),
                ('course', models.CharField(blank=True, max_length=200, null=True)),
                ('year_level', models.CharField(blank=True, max_length=50, null=True)),
                ('birthday', models.DateField(blank=True, null=True)),
                ('city_address', models.TextField(blank=True, null=True)),
                ('provincial_address', models.TextField(blank=True, null=True)),
                ('emergency_contact_name', models.CharField(blank=True, max_length=200, null=True)),
                ('emergency_contact_city_address', models.TextField(blank=True, null=True)),
                ('covid19_vaccination_status', models.CharField(blank=True, max_length=50, null=True)),
                ('menstruation_age_began', models.IntegerField(blank=True, null=True)),
                ('menstruation_regular', models.BooleanField(default=False)),
                ('menstruation_irregular', models.BooleanField(default=False)),
                ('number_of_pregnancies', models.IntegerField(blank=True, null=True)),
                ('number_of_live_children', models.IntegerField(blank=True, null=True)),
                ('menstrual_symptoms', models.JSONField(blank=True, default=list)),
                ('past_conditions_this_year', models.JSONField(blank=True, default=list)),
                ('hospital_admissions', models.JSONField(blank=True, default=list)),
                ('uhs_template_compliant', models.BooleanField(default=True)),
                ('record_completion_status', models.CharField(choices=[('incomplete', 'Incomplete'), ('complete', 'Complete'), ('pending_review', 'Pending Review')], default='incomplete', max_length=20)),
                ('staff_notes', models.TextField(blank=True, null=True)),
                ('semester_id', models.IntegerField(blank=True, null=True)),
                ('semester', models.CharField(blank=True, choices=[('1st_semester', 'First Semester'), ('2nd_semester', 'Second Semester'), ('summer', 'Summer Semester')], help_text='Semester period for this patient profile', max_length=20, null=True)),
            ],
            options={
                'db_table': 'api_patient',
                'ordering': ['-created_at'],
            },
        ),
        
        # Add unique constraint for Patient
        migrations.AddConstraint(
            model_name='patient',
            constraint=models.UniqueConstraint(fields=['user', 'school_year', 'semester'], name='api_patient_user_id_school_year_id_semester_ab980f66_uniq'),
        ),
        
        # Add indexes for Patient
        migrations.AddIndex(
            model_name='patient',
            index=models.Index(fields=['user'], name='api_patient_user_id_0944016a'),
        ),
        migrations.AddIndex(
            model_name='patient',
            index=models.Index(fields=['user', 'school_year'], name='api_patient_user_id_b1c93a_idx'),
        ),
    ]
'''

    # Write the migration file
    migration_file = 'api/migrations/0001_initial_complete.py'
    with open(migration_file, 'w') as f:
        f.write(migration_content)
    
    print("✓ Created comprehensive initial migration")

def remove_old_migrations():
    """Remove old migration files but keep __init__.py"""
    migrations_dir = 'api/migrations'
    
    for file in os.listdir(migrations_dir):
        if file.endswith('.py') and file != '__init__.py' and not file.startswith('0001_initial_complete'):
            os.remove(os.path.join(migrations_dir, file))
            print(f"✓ Removed old migration: {file}")

def main():
    print("=" * 70)
    print("Complete Migration Rewrite - Match SQL File")
    print("=" * 70)
    
    try:
        # Step 1: Backup existing migrations
        backup_dir = backup_existing_migrations()
        
        # Step 2: Clear migration records
        clear_migrations_table()
        
        # Step 3: Remove old migration files
        remove_old_migrations()
        
        # Step 4: Create new initial migration
        create_initial_migration()
        
        print("\n" + "=" * 70)
        print("✅ MIGRATION REWRITE COMPLETED!")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Review the new migration file")
        print("2. Run: python manage.py migrate --fake-initial")
        print("3. Test your application")
        print(f"4. Backup location: {backup_dir}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nThe backup is still available if you need to restore.")

if __name__ == "__main__":
    main()
