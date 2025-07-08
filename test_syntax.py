#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('c:/xampp/htdocs/wmsuhealthservices/backend/django_api')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

try:
    # Try to import the views module to check for syntax errors
    import api.views
    print("Views module imported successfully")
    
    # Check if AppointmentViewSet has the view_form_data method
    if hasattr(api.views.AppointmentViewSet, 'view_form_data'):
        print("view_form_data method found in AppointmentViewSet")
        method = getattr(api.views.AppointmentViewSet, 'view_form_data')
        print(f"Method: {method}")
    else:
        print("view_form_data method NOT found in AppointmentViewSet")
        print("Available methods in AppointmentViewSet:")
        for attr in dir(api.views.AppointmentViewSet):
            if not attr.startswith('_'):
                print(f"  - {attr}")
                
except SyntaxError as e:
    print(f"Syntax error in views.py: {e}")
    print(f"Line {e.lineno}: {e.text}")
except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Other error: {e}")
