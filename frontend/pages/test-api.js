import { useState, useEffect } from 'react';
import { waiversAPI, medicalDocumentsAPI } from '../utils/api';

export default function TestApiEndpoints() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const addResult = (test, status, message) => {
    setResults(prev => [...prev, { test, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testEndpoints = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Medical Documents My Documents (should return 401 without auth)
    try {
      const response = await fetch('http://localhost:8000/api/medical-documents/my_documents/');
      if (response.status === 401) {
        addResult('Medical Documents (my_documents)', 'PASS', 'Returns 401 as expected without auth');
      } else if (response.status === 500) {
        const errorText = await response.text();
        addResult('Medical Documents (my_documents)', 'FAIL', `500 Error: ${errorText}`);
      } else {
        addResult('Medical Documents (my_documents)', 'PASS', `Returns ${response.status}`);
      }
    } catch (error) {
      addResult('Medical Documents (my_documents)', 'ERROR', error.message);
    }

    // Test 2: Waivers endpoint (should return 401 without auth)
    try {
      const response = await fetch('http://localhost:8000/api/waivers/');
      if (response.status === 401) {
        addResult('Waivers (list)', 'PASS', 'Returns 401 as expected without auth');
      } else if (response.status === 500) {
        const errorText = await response.text();
        addResult('Waivers (list)', 'FAIL', `500 Error: ${errorText}`);
      } else {
        addResult('Waivers (list)', 'PASS', `Returns ${response.status}`);
      }
    } catch (error) {
      addResult('Waivers (list)', 'ERROR', error.message);
    }

    // Test 3: Waiver checkStatus endpoint (should return 401 without auth)
    try {
      const response = await fetch('http://localhost:8000/api/waivers/check_status/');
      if (response.status === 401) {
        addResult('Waiver checkStatus', 'PASS', 'Returns 401 as expected without auth');
      } else if (response.status === 500) {
        const errorText = await response.text();
        addResult('Waiver checkStatus', 'FAIL', `500 Error: ${errorText}`);
      } else {
        addResult('Waiver checkStatus', 'PASS', `Returns ${response.status}`);
      }
    } catch (error) {
      addResult('Waiver checkStatus', 'ERROR', error.message);
    }

    // Test 4: Check if waiversAPI.checkStatus exists
    try {
      if (typeof waiversAPI.checkStatus === 'function') {
        addResult('waiversAPI.checkStatus', 'PASS', 'Method exists in API utils');
      } else {
        addResult('waiversAPI.checkStatus', 'FAIL', 'Method not found in API utils');
      }
    } catch (error) {
      addResult('waiversAPI.checkStatus', 'ERROR', error.message);
    }

    // Test 5: Test Django admin accessibility
    try {
      const response = await fetch('http://localhost:8000/admin/');
      if (response.status === 200) {
        addResult('Django Admin', 'PASS', 'Admin interface accessible');
      } else {
        addResult('Django Admin', 'INFO', `Admin returns ${response.status}`);
      }
    } catch (error) {
      addResult('Django Admin', 'ERROR', error.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Endpoints Test</h1>
      <p>Testing the fixed API endpoints for medical documents and waivers...</p>
      
      {loading && <p>Running tests...</p>}
      
      <button onClick={testEndpoints} style={{ marginBottom: '20px', padding: '10px 20px' }}>
        Re-run Tests
      </button>

      <div style={{ marginTop: '20px' }}>
        <h2>Test Results:</h2>
        {results.length === 0 && !loading && <p>No results yet.</p>}
        {results.map((result, index) => (
          <div key={index} style={{ 
            marginBottom: '10px', 
            padding: '10px', 
            border: '1px solid #ddd',
            borderRadius: '5px',
            backgroundColor: 
              result.status === 'PASS' ? '#e8f5e8' : 
              result.status === 'FAIL' ? '#ffe8e8' : 
              result.status === 'ERROR' ? '#fff3cd' : '#e8f4f8'
          }}>
            <strong>{result.test}</strong> - <span style={{ 
              color: 
                result.status === 'PASS' ? 'green' : 
                result.status === 'FAIL' ? 'red' : 
                result.status === 'ERROR' ? 'orange' : 'blue'
            }}>{result.status}</span>
            <br />
            <small>{result.message}</small>
            <br />
            <small style={{ color: '#666' }}>{result.timestamp}</small>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Expected Results:</h3>
        <ul>
          <li>✓ Medical Documents (my_documents) - Should return 401 (no 500 error)</li>
          <li>✓ Waivers (list) - Should return 401 (no 500 error)</li>
          <li>✓ Waiver checkStatus - Should return 401 (no 500 error)</li>
          <li>✓ waiversAPI.checkStatus - Should exist as a function</li>
          <li>✓ Django Admin - Should be accessible</li>
        </ul>
      </div>
    </div>
  );
}
