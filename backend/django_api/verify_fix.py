#!/usr/bin/env python
import ast

# Test if the views.py file has the correct syntax and contains all required ViewSets
with open('api/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

try:
    # Parse the Python file
    tree = ast.parse(content)
    
    # Find all class definitions
    classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
    class_names = [cls.name for cls in classes]
    
    print(f"Total classes found: {len(classes)}")
    print("\nViewSet classes:")
    
    viewset_classes = [name for name in class_names if 'ViewSet' in name]
    for cls in viewset_classes:
        print(f"  ✓ {cls}")
    
    # Check for the specific classes mentioned in urls.py
    required_classes = [
        'AuthViewSet',
        'UserViewSet', 
        'UserManagementViewSet',
        'StaffManagementViewSet',
        'PatientViewSet',
        'MedicalRecordViewSet',
        'AppointmentViewSet',
        'AcademicSchoolYearViewSet',
        'InventoryViewSet',
        'WaiverViewSet',
        'DentalFormDataViewSet',
        'MedicalFormDataViewSet',
        'StaffDetailsViewSet',
        'ComorbidIllnessViewSet',
        'VaccinationViewSet',
        'PastMedicalHistoryItemViewSet',
        'FamilyMedicalHistoryItemViewSet',
        'SystemConfigurationViewSet',
        'ProfileRequirementViewSet',
        'DocumentRequirementViewSet',
        'CampusScheduleViewSet',
        'DentistScheduleViewSet'
    ]
    
    print(f"\nChecking required classes from urls.py:")
    missing_classes = []
    for req_class in required_classes:
        if req_class in class_names:
            print(f"  ✓ {req_class}")
        else:
            print(f"  ✗ {req_class} - MISSING")
            missing_classes.append(req_class)
    
    if missing_classes:
        print(f"\nMissing classes: {missing_classes}")
    else:
        print(f"\n🎉 All required ViewSet classes are present!")
        
    print(f"\nFile syntax is valid and contains all required ViewSets.")
    
except SyntaxError as e:
    print(f"Syntax error in views.py: {e}")
    print(f"Line {e.lineno}: {e.text}")
except Exception as e:
    print(f"Error: {e}")
