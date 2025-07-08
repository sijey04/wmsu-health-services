import requests

print("Testing my-details endpoint:")
try:
    response = requests.get('http://localhost:8000/api/staff-details/my-details/')
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Error: {e}')
    
print("\nTesting base staff-details endpoint:")
try:
    response = requests.get('http://localhost:8000/api/staff-details/')
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Error: {e}')
