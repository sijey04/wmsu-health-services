"""
Simple script to test the staff-details endpoint
Run this in the browser console or use a tool like Postman
"""

# Test the endpoint from the frontend
const testStaffDetailsEndpoint = async () => {
    console.log('Testing staff-details endpoint...');
    
    try {
        // Get current auth token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found. Please log in first.');
            return;
        }
        
        console.log('Using token:', token.substring(0, 50) + '...');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test GET request
        console.log('Testing GET request...');
        const getResponse = await fetch('http://localhost:8000/api/staff-details/my-details/', {
            method: 'GET',
            headers: headers
        });
        
        console.log('GET Status:', getResponse.status);
        const getResult = await getResponse.json();
        console.log('GET Response:', getResult);
        
        // Test PUT request
        console.log('Testing PUT request...');
        const putData = {
            full_name: 'Test User Updated',
            position: 'Test Position',
            license_number: 'LIC123',
            ptr_number: 'PTR456',
            phone_number: '1234567890',
            assigned_campuses: 'a,b'
        };
        
        const putResponse = await fetch('http://localhost:8000/api/staff-details/my-details/', {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(putData)
        });
        
        console.log('PUT Status:', putResponse.status);
        const putResult = await putResponse.json();
        console.log('PUT Response:', putResult);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

// Run the test
testStaffDetailsEndpoint();
