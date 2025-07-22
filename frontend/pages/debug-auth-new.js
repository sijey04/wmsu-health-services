import { useState, useEffect } from 'react';
import { waiversAPI, djangoApiClient } from '../utils/api';

export default function DebugAuth() {
  const [authInfo, setAuthInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const info = {
      access_token: localStorage.getItem('access_token'),
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      localStorage_keys: Object.keys(localStorage),
      current_url: window.location.href,
    };
    setAuthInfo(info);
  }, []);

  const addResult = (result) => {
    console.log('Test result:', result);
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testDirectFetch = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const result = { 
      method: 'Direct Fetch', 
      timestamp: new Date().toISOString(),
      token: token ? `${token.substring(0, 20)}...` : 'None'
    };
    
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
        result.message = 'Authentication required (expected)';
      } else if (response.status === 404) {
        result.message = 'Endpoint not found (unexpected!)';
      } else if (response.status === 200) {
        const data = await response.json();
        result.message = 'Success';
        result.data = data;
      } else {
        result.message = `Unexpected status: ${response.status}`;
      }
    } catch (error) {
      result.error = error.message;
      result.message = 'Network error';
    }
    
    addResult(result);
  };

  const testWaiversAPI = async () => {
    const result = { 
      method: 'waiversAPI.checkStatus', 
      timestamp: new Date().toISOString() 
    };
    
    try {
      const response = await waiversAPI.checkStatus();
      result.status = response.status;
      result.message = 'Success';
      result.data = response.data;
    } catch (error) {
      result.error = error.message;
      result.message = 'API Error';
      if (error.response) {
        result.status = error.response.status;
        result.statusText = error.response.statusText;
        result.responseData = error.response.data;
      }
      if (error.config) {
        result.requestURL = error.config.url;
        result.baseURL = error.config.baseURL;
        result.fullURL = `${error.config.baseURL}${error.config.url}`;
        result.headers = error.config.headers;
      }
    }
    
    addResult(result);
  };

  const testDjangoClient = async () => {
    const result = { 
      method: 'djangoApiClient.get', 
      timestamp: new Date().toISOString() 
    };
    
    try {
      const response = await djangoApiClient.get('/waivers/check_status/');
      result.status = response.status;
      result.message = 'Success';
      result.data = response.data;
    } catch (error) {
      result.error = error.message;
      result.message = 'Django Client Error';
      if (error.response) {
        result.status = error.response.status;
        result.statusText = error.response.statusText;
        result.responseData = error.response.data;
      }
      if (error.config) {
        result.requestURL = error.config.url;
        result.baseURL = error.config.baseURL;
        result.fullURL = `${error.config.baseURL}${error.config.url}`;
        result.headers = error.config.headers;
      }
    }
    
    addResult(result);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Authentication & API Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>LocalStorage Info:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(authInfo, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test API Calls:</h2>
        <button onClick={testDirectFetch} style={{ margin: '5px', padding: '8px' }}>
          1. Test Direct Fetch
        </button>
        <button onClick={testWaiversAPI} style={{ margin: '5px', padding: '8px' }}>
          2. Test waiversAPI.checkStatus
        </button>
        <button onClick={testDjangoClient} style={{ margin: '5px', padding: '8px' }}>
          3. Test djangoApiClient.get
        </button>
      </div>

      <div>
        <h2>Test Results:</h2>
        {testResults.length === 0 ? (
          <p>No tests run yet. Click a test button above.</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              background: result.error ? '#ffebee' : '#e8f5e8', 
              border: `1px solid ${result.error ? '#f44336' : '#4caf50'}`,
              padding: '10px', 
              margin: '10px 0',
              borderRadius: '4px'
            }}>
              <strong>{result.method}</strong> - {result.timestamp}
              <pre style={{ margin: '5px 0', fontSize: '11px' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '30px', background: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Check localStorage values above - you should see access_token if logged in</li>
          <li>Run &ldquo;Test Direct Fetch&rdquo; - should get 401 if no token, 200 if valid token</li>
          <li>Run &ldquo;Test waiversAPI.checkStatus&rdquo; - this is the failing call from dental.tsx</li>
          <li>Check the Console tab for additional debugging info</li>
          <li>Compare the URLs and responses between the different methods</li>
        </ol>
      </div>
    </div>
  );
}
