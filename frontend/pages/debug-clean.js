import { useState, useEffect } from 'react';
import { waiversAPI, djangoApiClient } from '../utils/api';

export default function DebugAuthClean() {
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
        result.message = 'Authentication required (expected without token)';
        result.responseText = await response.text();
      } else if (response.status === 404) {
        result.message = 'Endpoint not found (this is the problem!)';
        result.responseText = await response.text();
      } else if (response.status === 200) {
        const data = await response.json();
        result.message = 'Success - endpoint works!';
        result.data = data;
      } else {
        result.message = `Unexpected status: ${response.status}`;
        result.responseText = await response.text();
      }
    } catch (error) {
      result.error = error.message;
      result.message = 'Network error - server might be down';
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

  const testLogin = async () => {
    const result = { 
      method: 'Test Login', 
      timestamp: new Date().toISOString() 
    };
    
    try {
      // Test login with demo credentials
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'student@wmsu.edu.ph',
          password: 'password'
        })
      });
      
      result.status = response.status;
      if (response.status === 200) {
        const data = await response.json();
        result.message = 'Login successful';
        result.data = data;
        // Store the token
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          result.message += ' - Token stored in localStorage';
        }
      } else {
        result.message = 'Login failed';
        result.responseText = await response.text();
      }
    } catch (error) {
      result.error = error.message;
      result.message = 'Login request failed';
    }
    
    addResult(result);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>🔧 Authentication & API Debug Tool</h1>
      
      <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h2>📋 LocalStorage Info:</h2>
        <pre style={{ background: '#ffffff', padding: '10px', overflow: 'auto', maxHeight: '200px', border: '1px solid #ddd' }}>
          {JSON.stringify(authInfo, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>🧪 API Tests:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testDirectFetch} style={{ 
            margin: '5px', padding: '10px', background: '#007bff', color: 'white', 
            border: 'none', borderRadius: '5px', cursor: 'pointer' 
          }}>
            1. Test Direct Fetch
          </button>
          <button onClick={testWaiversAPI} style={{ 
            margin: '5px', padding: '10px', background: '#28a745', color: 'white', 
            border: 'none', borderRadius: '5px', cursor: 'pointer' 
          }}>
            2. Test waiversAPI.checkStatus
          </button>
          <button onClick={testLogin} style={{ 
            margin: '5px', padding: '10px', background: '#ffc107', color: 'black', 
            border: 'none', borderRadius: '5px', cursor: 'pointer' 
          }}>
            3. Test Login & Get Token
          </button>
        </div>
      </div>

      <div>
        <h2>📊 Test Results:</h2>
        {testResults.length === 0 ? (
          <div style={{ padding: '20px', background: '#e9ecef', borderRadius: '5px', textAlign: 'center' }}>
            <p>No tests run yet. Click a test button above to start debugging.</p>
          </div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              background: result.error ? '#f8d7da' : '#d4edda', 
              border: `1px solid ${result.error ? '#f5c6cb' : '#c3e6cb'}`,
              padding: '15px', 
              margin: '10px 0',
              borderRadius: '5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ color: result.error ? '#721c24' : '#155724' }}>
                  {result.method}
                </strong>
                <span style={{ fontSize: '10px', color: '#6c757d' }}>
                  {result.timestamp}
                </span>
              </div>
              
              {result.status && (
                <div style={{ marginBottom: '5px' }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    color: result.status >= 400 ? '#dc3545' : '#28a745',
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    {result.status} {result.statusText}
                  </span>
                </div>
              )}
              
              {result.message && (
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  {result.message}
                </div>
              )}
              
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 Full Details
                </summary>
                <pre style={{ 
                  margin: '10px 0 0 0', 
                  fontSize: '10px', 
                  background: '#ffffff', 
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '30px', background: '#fff3cd', padding: '15px', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
        <h3>📖 Instructions:</h3>
        <ol>
          <li><strong>Check localStorage:</strong> Should show access_token if logged in</li>
          <li><strong>Test Direct Fetch:</strong> Should get 401 if no token, 200 if valid token</li>
          <li><strong>Test waiversAPI:</strong> This replicates the failing call from dental.tsx</li>
          <li><strong>Test Login:</strong> Gets a fresh token if needed</li>
          <li><strong>Check Console:</strong> Additional debug info is logged there</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '10px', background: '#e2e3e5', borderRadius: '3px' }}>
          <strong>Expected Results:</strong>
          <ul style={{ marginTop: '5px', marginBottom: '0' }}>
            <li>Direct Fetch: 401 (no token) or 200 (with token)</li>
            <li>waiversAPI: Same as Direct Fetch if working correctly</li>
            <li>If getting 404 instead of 401/200, there's a routing issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
