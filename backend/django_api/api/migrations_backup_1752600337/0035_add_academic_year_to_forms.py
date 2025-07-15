# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_remove_medicaldocument_unique_medical_document_per_patient_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='dentalformdata',
            name='academic_year',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='dental_forms',
                to='api.academicschoolyear',
                db_constraint=False
            ),
        ),
        migrations.AddField(
            model_name='medicalformdata',
            name='academic_year',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='medical_forms',
                to='api.academicschoolyear',
                db_constraint=False
            ),
        ),
    ]
