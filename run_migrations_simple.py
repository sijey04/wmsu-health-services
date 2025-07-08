import os
import subprocess
import sys

# Set up environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')

# Change to the Django directory
os.chdir(r'C:\xampp\htdocs\wmsuhealthservices\backend\django_api')

print("Running Django migrations...")

try:
    # Run migrations using subprocess
    result = subprocess.run([sys.executable, 'manage.py', 'migrate'], 
                          capture_output=True, text=True, timeout=60)
    
    print("STDOUT:")
    print(result.stdout)
    
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
    
    if result.returncode == 0:
        print("✅ Migrations completed successfully!")
    else:
        print(f"❌ Migration failed with return code: {result.returncode}")
        
except subprocess.TimeoutExpired:
    print("❌ Migration timed out after 60 seconds")
except Exception as e:
    print(f"❌ Error running migrations: {e}")
