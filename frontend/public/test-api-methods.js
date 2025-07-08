// Simple test to verify API methods exist
console.log('Testing API methods...');

// Test if the API objects exist
if (typeof waiversAPI !== 'undefined') {
    console.log('✓ waiversAPI object exists');
    
    // Test if checkStatus method exists
    if (typeof waiversAPI.checkStatus === 'function') {
        console.log('✓ waiversAPI.checkStatus method exists');
    } else {
        console.log('✗ waiversAPI.checkStatus method missing');
    }
} else {
    console.log('✗ waiversAPI object not found');
}

// Test medical documents API
if (typeof medicalDocumentsAPI !== 'undefined') {
    console.log('✓ medicalDocumentsAPI object exists');
} else {
    console.log('✗ medicalDocumentsAPI object not found');
}

// Test if we can make a basic fetch request
fetch('http://localhost:8000/api/medical-documents/my_documents/')
    .then(response => {
        if (response.status === 401) {
            console.log('✓ Medical documents endpoint accessible (401 expected)');
        } else if (response.status === 500) {
            console.log('✗ Medical documents endpoint still returning 500');
        } else {
            console.log(`ℹ Medical documents endpoint returns ${response.status}`);
        }
    })
    .catch(error => {
        console.log(`✗ Error accessing medical documents endpoint: ${error.message}`);
    });

fetch('http://localhost:8000/api/waivers/check_status/')
    .then(response => {
        if (response.status === 401) {
            console.log('✓ Waiver check status endpoint accessible (401 expected)');
        } else if (response.status === 404) {
            console.log('✗ Waiver check status endpoint not found');
        } else {
            console.log(`ℹ Waiver check status endpoint returns ${response.status}`);
        }
    })
    .catch(error => {
        console.log(`✗ Error accessing waiver check status endpoint: ${error.message}`);
    });
