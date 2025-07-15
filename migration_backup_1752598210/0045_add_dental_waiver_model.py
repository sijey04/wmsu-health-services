# Generated manually for dental waiver model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0044_add_semester_to_appointment'),
    ]

    operations = [
        migrations.CreateModel(
            name='DentalWaiver',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_name', models.CharField(help_text='Full name of patient', max_length=100)),
                ('parent_guardian_name', models.CharField(blank=True, help_text='Name of parent/guardian if patient is minor', max_length=100, null=True)),
                ('residence', models.CharField(help_text='Residence address', max_length=200)),
                ('date_signed', models.DateField()),
                ('patient_signature', models.TextField(help_text='Base64-encoded patient signature image')),
                ('parent_guardian_signature', models.TextField(blank=True, help_text='Base64-encoded parent/guardian signature image', null=True)),
                ('witness_signature', models.TextField(blank=True, help_text='Base64-encoded witness signature image', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dental_waivers', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name='dentalwaiver',
            constraint=models.UniqueConstraint(fields=('user',), name='unique_dental_waiver_per_user'),
        ),
    ]
