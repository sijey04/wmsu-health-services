# Add missing school_year column to DentalWaiver table

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_campusschedule_comorbidillness_dentalformdata_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='dentalwaiver',
            name='school_year',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dental_waivers', to='api.academicschoolyear'),
        ),
    ]
