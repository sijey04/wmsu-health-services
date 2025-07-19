import os
import sys
import subprocess

# Change to the Django project directory
os.chdir(r'c:\xampp\htdocs\wmsuhealthservices\backend\django_api')

try:
    # Try to run Django check command
    result = subprocess.run([sys.executable, 'manage.py', 'check'], 
                          capture_output=True, text=True, timeout=30)
    
    if result.returncode == 0:
        print("✓ Django check passed successfully!")
        print("Output:", result.stdout)
    else:
        print("✗ Django check failed!")
        print("Error:", result.stderr)
        print("Output:", result.stdout)
        
    # Try to show migrations
    print("\n" + "="*50)
    print("Checking migration status...")
    
    result2 = subprocess.run([sys.executable, 'manage.py', 'showmigrations', 'api'], 
                           capture_output=True, text=True, timeout=30)
    
    if result2.returncode == 0:
        print("✓ Migration status check passed!")
        print("Migrations:", result2.stdout)
    else:
        print("✗ Migration status check failed!")
        print("Error:", result2.stderr)
        
except subprocess.TimeoutExpired:
    print("✗ Command timed out")
except Exception as e:
    print(f"✗ Error running command: {e}")
