#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('c:/xampp/htdocs/wmsuhealthservices/backend/django_api')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

# Now import Django modules
from django.urls import reverse
from api.models import Appointment

try:
    # Check if appointment 49 exists
    appointment = Appointment.objects.get(id=49)
    print(f"Appointment 49 found: {appointment}")
    print(f"Type: {appointment.type}")
    print(f"Status: {appointment.status}")
    
    # Check if it has medical form data
    if appointment.type == 'medical':
        medical_forms = appointment.medical_form_data.all()
        print(f"Medical forms count: {medical_forms.count()}")
        for form in medical_forms:
            print(f"Medical form: {form.id}")
    
    # Check if it has dental form data
    if appointment.type == 'dental':
        dental_forms = appointment.dental_form_data.all()
        print(f"Dental forms count: {dental_forms.count()}")
        for form in dental_forms:
            print(f"Dental form: {form.id}")
    
    # Try to get the URL for view_form_data
    try:
        # Try different URL patterns
        patterns_to_try = [
            'appointment-view-form-data',
            'appointments-view-form-data', 
            'appointmentviewset-view-form-data',
            'api:appointment-view-form-data'
        ]
        
        for pattern in patterns_to_try:
            try:
                url = reverse(pattern, kwargs={'pk': 49})
                print(f"URL for {pattern}: {url}")
                break
            except:
                continue
        else:
            print("Could not find correct URL pattern")
            
        # Let's check what URLs are available for appointments
        from django.conf import settings
        from django.urls import get_resolver
        resolver = get_resolver(settings.ROOT_URLCONF)
        
        print("\nAvailable URL patterns:")
        for pattern in resolver.url_patterns:
            if hasattr(pattern, 'pattern') and 'appointment' in str(pattern.pattern):
                print(f"Pattern: {pattern.pattern}")
                
    except Exception as e:
        print(f"Error getting URL: {e}")

except Appointment.DoesNotExist:
    print("Appointment 49 does not exist")
except Exception as e:
    print(f"Error: {e}")
