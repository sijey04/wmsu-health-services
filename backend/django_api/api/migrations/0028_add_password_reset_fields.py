from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0027_alter_patient_religion'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='password_reset_token',
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='password_reset_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
