from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # This might need to be adjusted based on your actual migration history
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicSemester',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('semester_type', models.CharField(choices=[('1st', '1st Semester'), ('2nd', '2nd Semester'), ('summer', 'Summer'), ('midyear', 'Midyear')], max_length=10)),
                ('academic_year', models.CharField(help_text='e.g., "2025-2026"', max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_current', models.BooleanField(default=False)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('upcoming', 'Upcoming'), ('completed', 'Completed')], default='upcoming', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-academic_year', 'semester_type'],
                'db_table': 'api_academicsemester',
            },
        ),
    ]
