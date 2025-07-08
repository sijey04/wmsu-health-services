import os
import sys
import django
from django.conf import settings

# Add the Django project to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Set up Django  
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver
from rest_framework.routers import DefaultRouter
from api.views import StaffDetailsViewSet

def print_url_patterns(urlpatterns, prefix=''):
    """Print all URL patterns in the Django project"""
    for pattern in urlpatterns:
        if isinstance(pattern, URLPattern):
            print(f"{prefix}{pattern.pattern}")
        elif isinstance(pattern, URLResolver):
            print(f"{prefix}{pattern.pattern}")
            print_url_patterns(pattern.url_patterns, prefix + '  ')

def check_staff_details_viewset():
    """Check if StaffDetailsViewSet has the my_details action"""
    print("Checking StaffDetailsViewSet...")
    viewset = StaffDetailsViewSet()
    
    # Check if my_details action exists
    if hasattr(viewset, 'my_details'):
        print("✓ my_details action exists")
        action = getattr(viewset, 'my_details')
        print(f"✓ my_details action: {action}")
        
        # Check if it's properly decorated
        if hasattr(action, 'mapping'):
            print(f"✓ my_details mapping: {action.mapping}")
        else:
            print("✗ my_details action is not properly decorated")
    else:
        print("✗ my_details action does not exist")

def check_router_registration():
    """Check if StaffDetailsViewSet is properly registered in the router"""
    print("Checking router registration...")
    
    # Create a router like in urls.py
    router = DefaultRouter()
    router.register(r'staff-details', StaffDetailsViewSet)
    
    # Get the URL patterns
    url_patterns = router.urls
    
    print(f"Router generated {len(url_patterns)} URL patterns:")
    for pattern in url_patterns:
        print(f"  {pattern.pattern}")
        if hasattr(pattern, 'callback') and hasattr(pattern.callback, 'cls'):
            print(f"    -> {pattern.callback.cls.__name__}")
            if hasattr(pattern.callback, 'actions'):
                print(f"    -> actions: {pattern.callback.actions}")

def main():
    print("=== Django API Endpoint Debugging ===\n")
    
    print("1. Checking URL patterns...")
    resolver = get_resolver()
    print_url_patterns(resolver.url_patterns)
    
    print("\n2. Checking StaffDetailsViewSet...")
    check_staff_details_viewset()
    
    print("\n3. Checking router registration...")
    check_router_registration()
    
    print("\n=== Debug Complete ===")

if __name__ == '__main__':
    main()
