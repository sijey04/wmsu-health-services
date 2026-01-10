# Generated manually on 2026-01-10 for nationality specification field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_alter_dentalformdata_consultation_template_compliant_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='nationality_specify',
            field=models.CharField(blank=True, max_length=100, null=True, help_text='Specify nationality if Foreigner is selected'),
        ),
    ]
