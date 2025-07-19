import { useState, useEffect } from 'react';
import { waiversAPI } from '../utils/api';

export default function DebugAuth() {
  const [authInfo, setAuthInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const info = {
      access_token: localStorage.getItem('access_token'),
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      localStorage_keys: Object.keys(localStorage),
    };
    setAuthInfo(info);
  }, []);

  const testDirectFetch = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const result = { method: 'Direct Fetch', timestamp: new Date().toISOString() };
    
    try {
      const response = await fetch('http://localhost:8000/api/waivers/check_status/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      result.status = response.status;
      result.statusText = response.statusText;
      result.url = response.url;
      
      if (response.status === 401) {
        result.message = '401 - Authentication required';
      } else if (response.status === 404) {
        result.message = '404 - Endpoint not found';
      } else if (response.status === 200) {
        const data = await response.json();
        result.message = 'Success';
        result.data = data;
      } else {
        result.message = `Unexpected status: ${response.status}`;
      }
    } catch (error) {
      result.error = error.message;
    }
    
    console.log('Direct fetch result:', result);
    setTestResults(prev => [result, ...prev]);
  };

  const testWaiversAPI = async () => {
    const result = { method: 'waiversAPI.checkStatus', timestamp: new Date().toISOString() };
    
    try {
      const response = await waiversAPI.checkStatus();
      result.status = response.status;
      result.message = 'Success';
      result.data = response.data;
    } catch (error) {
      result.error = error.message;
      if (error.response) {
        result.status = error.response.status;
        result.statusText = error.response.statusText;
        result.url = error.config?.url;
        result.baseURL = error.config?.baseURL;
        result.fullURL = `${error.config?.baseURL}${error.config?.url}`;
      }
    }
    
    console.log('waiversAPI result:', result);
    setTestResults(prev => [result, ...prev]);
  };
  const [testResult, setTestResult] = useState('');
  const [directTestResult, setDirectTestResult] = useState('');

  useEffect(() => {
    // Get auth info from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setAuthInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      hasUser: !!user,
      userData: user ? JSON.parse(user) : null
    });
  }, []);

  const testWaiverEndpoint = async () => {
    try {
      setTestResult('Testing...');
      const response = await waiversAPI.checkStatus();
      setTestResult(`Success: ${JSON.stringify(response.data)}`);
    } catch (error) {
      setTestResult(`Error: ${error.message} - Status: ${error.response?.status} - Data: ${JSON.stringify(error.response?.data)}`);
    }
  };

  const testDirectFetch = async () => {
    try {
      setDirectTestResult('Testing direct fetch...');
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:8000/api/waivers/check_status/', {
        method: 'GET',
        headers: headers
      });
      
      const data = await response.text();
      setDirectTestResult(`Status: ${response.status} - Response: ${data}`);
    } catch (error) {
      setDirectTestResult(`Direct fetch error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authentication Debug</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Authentication Info:</h3>
        <pre>{JSON.stringify(authInfo, null, 2)}</pre>
      </div>

      <button 
        onClick={testWaiverEndpoint}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '10px',
          marginRight: '10px'
        }}
      >
        Test Waiver Endpoint (API)
      </button>

      <button 
        onClick={testDirectFetch}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Test Direct Fetch
      </button>

      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>API Test Result:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{testResult}</pre>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <h3>Direct Fetch Result:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{directTestResult}</pre>
      </div>
    </div>
  );
}
