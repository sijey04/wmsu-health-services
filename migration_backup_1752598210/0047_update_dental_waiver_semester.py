# Generated migration for updating DentalWaiver model with semester support

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0046_add_semester_to_patient'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dentalwaiver',
            name='parent_guardian_name',
        ),
        migrations.RemoveField(
            model_name='dentalwaiver',
            name='residence',
        ),
        migrations.RemoveField(
            model_name='dentalwaiver',
            name='witness_signature',
        ),
        migrations.AddField(
            model_name='dentalwaiver',
            name='guardian_name',
            field=models.CharField(blank=True, help_text='Name of parent/guardian if patient is minor', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='dentalwaiver',
            name='guardian_signature',
            field=models.TextField(blank=True, help_text='Base64-encoded parent/guardian signature image', null=True),
        ),
        migrations.AddField(
            model_name='dentalwaiver',
            name='patient',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='dental_waivers', to='api.patient'),
        ),
        migrations.AddField(
            model_name='dentalwaiver',
            name='school_year',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dental_waivers', to='api.academicschoolyear'),
        ),
        migrations.AddField(
            model_name='dentalwaiver',
            name='semester',
            field=models.CharField(blank=True, choices=[('1st_semester', 'First Semester'), ('2nd_semester', 'Second Semester'), ('summer', 'Summer Semester')], help_text='Semester period for this dental waiver', max_length=20, null=True),
        ),
        migrations.RemoveConstraint(
            model_name='dentalwaiver',
            name='unique_dental_waiver_per_user',
        ),
        migrations.AddConstraint(
            model_name='dentalwaiver',
            constraint=models.UniqueConstraint(fields=('user', 'school_year', 'semester'), name='unique_dental_waiver_per_user_semester'),
        ),
    ]
