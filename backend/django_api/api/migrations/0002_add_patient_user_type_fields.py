# Generated manually on 2025-07-20 for user type specific fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_production_schema'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='user_type',
            field=models.CharField(max_length=50, blank=True, null=True, help_text='User type from signup (Employee, College, etc.)'),
        ),
        migrations.AddField(
            model_name='patient',
            name='employee_id',
            field=models.CharField(max_length=50, blank=True, null=True, help_text='Employee ID for Employee user type'),
        ),
        migrations.AddField(
            model_name='patient',
            name='position_type',
            field=models.CharField(max_length=50, blank=True, null=True, help_text='Teaching or Non-Teaching for Employee user type'),
        ),
        migrations.AddField(
            model_name='patient',
            name='strand',
            field=models.CharField(max_length=100, blank=True, null=True, help_text='Strand for Senior High School user type'),
        ),
    ]
