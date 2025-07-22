# Generated manually to add only UserTypeInformation model
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_acknowledge_existing_dental_consultation_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserTypeInformation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Name of the user type (e.g., Employee, College, etc.)', max_length=100, unique=True)),
                ('enabled', models.BooleanField(default=True, help_text='Whether this user type is available for selection')),
                ('description', models.TextField(blank=True, help_text='Description of this user type', null=True)),
                ('required_fields', models.JSONField(blank=True, default=list, help_text='List of field names that are required for this user type')),
                ('available_courses', models.JSONField(blank=True, default=list, help_text='List of available courses for this user type (for College/Incoming Freshman)')),
                ('available_departments', models.JSONField(blank=True, default=list, help_text='List of available departments for this user type (for Employee)')),
                ('available_strands', models.JSONField(blank=True, default=list, help_text='List of available strands for this user type (for Senior High School)')),
                ('year_levels', models.JSONField(blank=True, default=list, help_text='List of available year/grade levels for this user type')),
                ('position_types', models.JSONField(blank=True, default=list, help_text='List of available position types for this user type (for Employee)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_user_types', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Type Information',
                'verbose_name_plural': 'User Type Information',
                'ordering': ['name'],
            },
        ),
    ]
