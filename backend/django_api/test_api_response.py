import requests
import json

def test_medical_documents_api():
    print("Testing Medical Documents API...")
    
    # Test the API endpoint
    url = "http://localhost:8000/api/medical-documents/"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of documents: {len(data)}")
            
            if data:
                # Look at the first document
                first_doc = data[0]
                print("\nFirst document structure:")
                print(json.dumps(first_doc, indent=2))
                
                print("\nPatient-related fields:")
                patient_fields = [key for key in first_doc.keys() if 'patient' in key.lower() or key in [
                    'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth',
                    'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
                    'emergency_contact_relationship', 'medical_history', 'allergies', 'medications'
                ]]
                
                for field in patient_fields:
                    value = first_doc.get(field, 'NOT FOUND')
                    print(f"  {field}: {value}")
            else:
                print("No documents found")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    test_medical_documents_api()
