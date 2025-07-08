/*
Test the staff details endpoint with proper authentication
Run this in browser console after logging in
*/

// Test from browser console
const testEndpoint = async () => {
    console.log('Testing staff-details endpoint with authentication...');
    
    const token = localStorage.getItem('access_token');
    console.log('Token available:', token ? 'YES' : 'NO');
    
    if (!token) {
        console.error('No token found. Please log in first.');
        return;
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        console.log('Testing GET request...');
        const getResponse = await fetch('http://localhost:8000/api/staff-details/my-details/', {
            method: 'GET',
            headers: headers
        });
        
        console.log('GET Status:', getResponse.status);
        const getResult = await getResponse.json();
        console.log('GET Response:', getResult);
        
        if (getResponse.status === 200) {
            console.log('✓ GET request successful');
        } else {
            console.log('✗ GET request failed');
        }
        
        // Test PUT request
        console.log('\nTesting PUT request...');
        const putData = {
            full_name: 'Test User',
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
        
        if (putResponse.status === 200 || putResponse.status === 201) {
            console.log('✓ PUT request successful');
        } else {
            console.log('✗ PUT request failed');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testEndpoint();
