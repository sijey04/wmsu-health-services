import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, Patient
from api.serializers import PatientProfileUpdateSerializer

user = CustomUser.objects.first()
print("Before:", user.first_name, user.last_name)

patient = Patient.objects.filter(user=user).first()
if patient:
    print("Patient before:", patient.first_name, patient.name)
    serializer = PatientProfileUpdateSerializer(patient, data={'first_name': 'NewFirst', 'name': 'NewLast'}, partial=True)
    if serializer.is_valid():
        serializer.save()
        user.refresh_from_db()
        print("After:", user.first_name, user.last_name)
    else:
        print("Errors:", serializer.errors)
else:
    print("No patient found for user")
