# Generated migration for adding semester field to Patient model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_add_dental_waiver_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='semester',
            field=models.CharField(blank=True, choices=[('1st_semester', 'First Semester'), ('2nd_semester', 'Second Semester'), ('summer', 'Summer Semester')], help_text='Semester period for this patient profile', max_length=20, null=True),
        ),
        migrations.AlterUniqueTogether(
            name='patient',
            unique_together={('user', 'school_year', 'semester')},
        ),
        migrations.RemoveIndex(
            model_name='patient',
            name='api_patient_user_id_school_year_id_index',
        ),
        migrations.AddIndex(
            model_name='patient',
            index=models.Index(fields=['user', 'school_year', 'semester'], name='api_patient_user_school_semester_idx'),
        ),
    ]
