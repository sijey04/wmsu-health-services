#!/usr/bin/env python
import ast
import sys

# Read the views.py file
with open('api/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

try:
    # Parse the AST
    tree = ast.parse(content)
    
    # Find all class definitions
    classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
    
    print("Found classes:")
    for cls in classes:
        print(f"  - {cls.name}")
        
    # Check if StaffManagementViewSet exists
    staff_mgmt_class = [cls for cls in classes if cls.name == 'StaffManagementViewSet']
    if staff_mgmt_class:
        print(f"\nStaffManagementViewSet found at line {staff_mgmt_class[0].lineno}")
    else:
        print("\nStaffManagementViewSet NOT found")
        
except SyntaxError as e:
    print(f"Syntax error in views.py: {e}")
    print(f"Line {e.lineno}: {e.text}")
except Exception as e:
    print(f"Other error: {e}")
