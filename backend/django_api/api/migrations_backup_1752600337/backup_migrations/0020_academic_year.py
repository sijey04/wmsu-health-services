from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # Let Django determine the dependencies automatically
        ('api', '0019_alter_appointment_campus_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicYear',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.CharField(help_text='e.g., "2025-2026"', max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_current', models.BooleanField(default=False)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('upcoming', 'Upcoming'), ('completed', 'Completed')], default='upcoming', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'api_academicyear',
                'ordering': ['-academic_year'],
            },
        ),
    ],
