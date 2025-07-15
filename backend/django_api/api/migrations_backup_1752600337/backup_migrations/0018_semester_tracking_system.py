# Generated migration for semester tracking system

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_campusschedule_documentrequirement_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicSemester',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('semester_type', models.CharField(choices=[('1st', '1st Semester'), ('2nd', '2nd Semester'), ('summer', 'Summer'), ('midyear', 'Midyear')], max_length=10)),
                ('academic_year', models.CharField(help_text='e.g., "2024-2025"', max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('enrollment_start', models.DateField()),
                ('enrollment_end', models.DateField()),
                ('status', models.CharField(choices=[('upcoming', 'Upcoming'), ('active', 'Active'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='upcoming', max_length=20)),
                ('is_current', models.BooleanField(default=False)),
                ('health_clearance_required', models.BooleanField(default=True)),
                ('medical_exam_required', models.BooleanField(default=False)),
                ('vaccination_check_required', models.BooleanField(default=False)),
                ('description', models.TextField(blank=True, null=True)),
                ('special_instructions', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-academic_year', '-semester_type'],
            },
        ),
        migrations.CreateModel(
            name='StudentSemesterProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_level', models.CharField(blank=True, max_length=20, null=True)),
                ('course_program', models.CharField(blank=True, max_length=100, null=True)),
                ('enrollment_status', models.CharField(choices=[('enrolled', 'Enrolled'), ('not_enrolled', 'Not Enrolled'), ('dropped', 'Dropped'), ('graduated', 'Graduated'), ('transferred', 'Transferred'), ('leave_of_absence', 'Leave of Absence')], default='enrolled', max_length=20)),
                ('health_status', models.CharField(choices=[('pending', 'Pending'), ('compliant', 'Compliant'), ('non_compliant', 'Non-Compliant'), ('conditional', 'Conditional'), ('exempted', 'Exempted')], default='pending', max_length=20)),
                ('health_clearance_date', models.DateField(blank=True, null=True)),
                ('health_clearance_expires', models.DateField(blank=True, null=True)),
                ('health_clearance_issued_by', models.CharField(blank=True, max_length=200, null=True)),
                ('medical_exam_completed', models.BooleanField(default=False)),
                ('medical_exam_date', models.DateField(blank=True, null=True)),
                ('dental_exam_completed', models.BooleanField(default=False)),
                ('dental_exam_date', models.DateField(blank=True, null=True)),
                ('vaccination_status_checked', models.BooleanField(default=False)),
                ('vaccination_check_date', models.DateField(blank=True, null=True)),
                ('height', models.DecimalField(blank=True, decimal_places=2, help_text='Height in cm', max_digits=5, null=True)),
                ('weight', models.DecimalField(blank=True, decimal_places=2, help_text='Weight in kg', max_digits=5, null=True)),
                ('bmi', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('blood_pressure_systolic', models.IntegerField(blank=True, null=True)),
                ('blood_pressure_diastolic', models.IntegerField(blank=True, null=True)),
                ('compliance_notes', models.TextField(blank=True, null=True)),
                ('exemption_reason', models.TextField(blank=True, null=True)),
                ('special_conditions', models.TextField(blank=True, null=True)),
                ('has_medical_restrictions', models.BooleanField(default=False)),
                ('requires_follow_up', models.BooleanField(default=False)),
                ('follow_up_notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='semester_profiles', to='api.patient')),
                ('semester', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_profiles', to='api.academicsemester')),
            ],
            options={
                'ordering': ['-semester__academic_year', '-semester__semester_type'],
            },
        ),
        migrations.CreateModel(
            name='SemesterHealthRequirement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requirement_type', models.CharField(choices=[('medical_exam', 'Medical Examination'), ('dental_exam', 'Dental Examination'), ('vaccination', 'Vaccination'), ('chest_xray', 'Chest X-ray'), ('blood_test', 'Blood Test'), ('urinalysis', 'Urinalysis'), ('drug_test', 'Drug Test'), ('psychological_exam', 'Psychological Examination'), ('fitness_test', 'Physical Fitness Test'), ('vision_test', 'Vision Test'), ('hearing_test', 'Hearing Test'), ('hepatitis_b', 'Hepatitis B Test'), ('medical_certificate', 'Medical Certificate')], max_length=30)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('instructions', models.TextField(blank=True, null=True)),
                ('is_mandatory', models.BooleanField(default=True)),
                ('applies_to', models.CharField(choices=[('all', 'All Students'), ('freshmen', 'Freshmen Only'), ('transferees', 'Transferees Only'), ('specific_courses', 'Specific Courses'), ('year_level', 'Specific Year Level'), ('sports_participation', 'Sports Participation'), ('internship', 'Internship/OJT')], default='all', max_length=20)),
                ('specific_courses', models.JSONField(blank=True, help_text='List of specific courses', null=True)),
                ('specific_year_levels', models.JSONField(blank=True, help_text='List of specific year levels', null=True)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('grace_period_days', models.IntegerField(default=0)),
                ('reminder_days_before', models.IntegerField(default=7, help_text='Send reminder X days before due date')),
                ('validity_period_months', models.IntegerField(default=12)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('semester', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='health_requirements', to='api.academicsemester')),
            ],
            options={
                'ordering': ['semester', 'name'],
            },
        ),
        migrations.CreateModel(
            name='SemesterHealthSummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_students', models.IntegerField(default=0)),
                ('compliant_students', models.IntegerField(default=0)),
                ('non_compliant_students', models.IntegerField(default=0)),
                ('pending_students', models.IntegerField(default=0)),
                ('total_requirements', models.IntegerField(default=0)),
                ('completed_requirements', models.IntegerField(default=0)),
                ('pending_requirements', models.IntegerField(default=0)),
                ('overdue_requirements', models.IntegerField(default=0)),
                ('compliance_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('completion_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('semester', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='health_summary', to='api.academicsemester')),
            ],
            options={
                'ordering': ['-semester__academic_year', '-semester__semester_type'],
            },
        ),
        migrations.CreateModel(
            name='StudentRequirementStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('overdue', 'Overdue'), ('exempted', 'Exempted'), ('waived', 'Waived'), ('not_applicable', 'Not Applicable')], default='pending', max_length=20)),
                ('completion_date', models.DateField(blank=True, null=True)),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('exemption_reason', models.TextField(blank=True, null=True)),
                ('waiver_reason', models.TextField(blank=True, null=True)),
                ('waiver_approved_by', models.CharField(blank=True, max_length=200, null=True)),
                ('submitted_date', models.DateField(blank=True, null=True)),
                ('reviewed_date', models.DateField(blank=True, null=True)),
                ('reviewed_by', models.CharField(blank=True, max_length=200, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('medical_document', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.medicaldocument')),
                ('medical_record', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.medicalrecord')),
                ('requirement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_statuses', to='api.semesterhealthrequirement')),
                ('student_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='requirement_statuses', to='api.studentsemesterprofile')),
            ],
            options={
                'ordering': ['requirement__name'],
            },
        ),
        # Add semester field to existing models
        migrations.AddField(
            model_name='medicalrecord',
            name='semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='medical_records', to='api.academicsemester'),
        ),
        migrations.AddField(
            model_name='medicalrecord',
            name='is_routine_checkup',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='medicalrecord',
            name='is_pre_enrollment',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='medicalrecord',
            name='affects_clearance',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='api.academicsemester'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='is_clearance_related',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='clearance_type',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='medicaldocument',
            name='semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='medical_documents', to='api.academicsemester'),
        ),
        migrations.AddField(
            model_name='medicaldocument',
            name='valid_until_semester',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='valid_documents', to='api.academicsemester'),
        ),
        migrations.AddField(
            model_name='medicaldocument',
            name='renewal_required',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='medicaldocument',
            name='renewal_due_date',
            field=models.DateField(blank=True, null=True),
        ),
        # Add constraints
        migrations.AddConstraint(
            model_name='academicsemester',
            constraint=models.UniqueConstraint(fields=['semester_type', 'academic_year'], name='unique_semester_per_year'),
        ),
        migrations.AddConstraint(
            model_name='studentsemesterprofile',
            constraint=models.UniqueConstraint(fields=['patient', 'semester'], name='unique_student_semester_profile'),
        ),
        migrations.AddConstraint(
            model_name='semesterhealthrequirement',
            constraint=models.UniqueConstraint(fields=['semester', 'requirement_type', 'applies_to'], name='unique_semester_requirement'),
        ),
        migrations.AddConstraint(
            model_name='studentrequirementstatus',
            constraint=models.UniqueConstraint(fields=['student_profile', 'requirement'], name='unique_student_requirement_status'),
        ),
    ]
