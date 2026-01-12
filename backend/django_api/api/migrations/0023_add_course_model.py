# Generated migration for Course model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_remove_patient_unique_constraint'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Full name of the course (e.g., BS Computer Science)', max_length=200)),
                ('code', models.CharField(blank=True, help_text='Course code (e.g., BSCS)', max_length=20, null=True)),
                ('college', models.CharField(blank=True, help_text='College offering the course', max_length=200, null=True)),
                ('department', models.CharField(blank=True, help_text='Department offering the course', max_length=200, null=True)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this course is currently active and available for selection')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_courses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Course/Program',
                'verbose_name_plural': 'Courses/Programs',
                'ordering': ['name'],
            },
        ),
    ]
