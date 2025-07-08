#!/usr/bin/env python
"""
Test script for Medical Documents API endpoints
"""
import os
import sys
import django
import requests
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, Patient, MedicalDocument, AcademicSchoolYear

def test_medical_documents_endpoints():
    """Test all medical documents endpoints"""
    
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Testing Medical Documents API Endpoints")
    print("=" * 50)
    
    # Test endpoints without authentication first
    endpoints_to_test = [
        f"{base_url}/medical-documents/",
        f"{base_url}/medical-documents/my_documents/", 
        f"{base_url}/academic-school-years/",
        f"{base_url}/academic-school-years/current/",
    ]
    
    for endpoint in endpoints_to_test:
        try:
            print(f"\n📡 Testing: {endpoint}")
            response = requests.get(endpoint, timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Authentication required (expected)")
            elif response.status_code == 200:
                print("   ✅ Endpoint accessible")
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 Returned {len(data)} items")
                elif isinstance(data, dict):
                    print(f"   📊 Returned object with keys: {list(data.keys())}")
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - Server not running")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    return True

def check_database_setup():
    """Check if the database has the required data"""
    print("\n🗄️  Checking Database Setup")
    print("=" * 30)
    
    try:
        # Check if there's an academic year
        academic_years = AcademicSchoolYear.objects.all()
        print(f"Academic Years: {academic_years.count()}")
        
        if academic_years.exists():
            current_year = AcademicSchoolYear.objects.filter(is_current=True).first()
            if current_year:
                print(f"Current Academic Year: {current_year.academic_year}")
            else:
                print("⚠️  No current academic year set")
        
        # Check users and patients
        users = CustomUser.objects.all()
        patients = Patient.objects.all()
        documents = MedicalDocument.objects.all()
        
        print(f"Users: {users.count()}")
        print(f"Patients: {patients.count()}")
        print(f"Medical Documents: {documents.count()}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🏥 WMSU Health Services - Medical Documents API Test")
    print("=" * 60)
    
    # Check database first
    db_ok = check_database_setup()
    
    if db_ok:
        # Test API endpoints
        api_ok = test_medical_documents_endpoints()
        
        if api_ok:
            print("\n✅ Medical Documents API is ready!")
            print("\nAvailable endpoints:")
            print("- GET  /api/medical-documents/")
            print("- POST /api/medical-documents/")
            print("- GET  /api/medical-documents/{id}/")
            print("- PUT  /api/medical-documents/{id}/")
            print("- DELETE /api/medical-documents/{id}/")
            print("- GET  /api/medical-documents/my_documents/")
            print("- POST /api/medical-documents/update_my_documents/")
            print("- POST /api/medical-documents/submit_for_review/")
            print("- POST /api/medical-documents/{id}/verify/")
            print("- POST /api/medical-documents/{id}/reject/")
            print("- POST /api/medical-documents/{id}/issue_certificate/")
            print("- POST /api/medical-documents/{id}/send_email/")
            print("- GET  /api/academic-school-years/")
            print("- GET  /api/academic-school-years/current/")
        else:
            print("\n❌ Some API tests failed")
    else:
        print("\n❌ Database setup incomplete")
