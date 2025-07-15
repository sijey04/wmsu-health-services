# Generated manually for appointment semester field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0043_add_semester_fields_to_academic_year'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='semester',
            field=models.CharField(
                blank=True, 
                choices=[
                    ('1st_semester', 'First Semester'), 
                    ('2nd_semester', 'Second Semester'), 
                    ('summer', 'Summer Semester')
                ], 
                help_text='Semester period for this appointment', 
                max_length=20, 
                null=True
            ),
        ),
    ]
