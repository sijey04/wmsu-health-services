import os
import sys
import shutil

# Clear Python cache
django_api_path = r"c:\xampp\htdocs\wmsuhealthservices\backend\django_api"

# Remove __pycache__ directories
for root, dirs, files in os.walk(django_api_path):
    for dir_name in dirs:
        if dir_name == "__pycache__":
            pycache_path = os.path.join(root, dir_name)
            print(f"Removing: {pycache_path}")
            try:
                shutil.rmtree(pycache_path)
                print(f"✓ Removed {pycache_path}")
            except Exception as e:
                print(f"✗ Failed to remove {pycache_path}: {e}")

print("\n✅ Python cache cleanup completed")
print("Now try running Django server again.")
