'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function DebugPage() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestUrl, setRequestUrl] = useState('/api/csrf/');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [postData, setPostData] = useState('{\n  "email": "test@example.com",\n  "password": "password123"\n}');

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (method === 'GET') {
        response = await api.get(requestUrl);
      } else {
        // Parse JSON data for POST
        const data = JSON.parse(postData);
        response = await api.post(requestUrl, data);
      }
      
      setResponse(response.data);
    } catch (err: any) {
      console.error('Error fetching:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        setResponse(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCounselorLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get CSRF token
      const csrfResponse = await api.get('/api/csrf/');
      api.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
      
      // Then try counselor login
      const loginData = {
        email: 'test@example.com',  // Example data
        password: 'password123'
      };
      
      const response = await api.post('/api/counselors/auth/login/', loginData);
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user_type', 'counselor');
        localStorage.setItem('counselor_id', response.data.counselor_id);
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('name', response.data.name || '');
      }
      
      setResponse(response.data);
    } catch (err: any) {
      console.error('Error with counselor login:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        setResponse(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Test API Endpoint</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
              className="border border-gray-300 rounded px-3 py-2"
              aria-label="HTTP Method"
              title="Select HTTP method"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
            
            <input
              type="text"
              value={requestUrl}
              onChange={(e) => setRequestUrl(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              placeholder="API URL (e.g., /api/csrf/)"
            />
          </div>
          
          {method === 'POST' && (
            <div>
              <label htmlFor="postDataInput" className="block text-sm font-medium text-gray-700 mb-1">
                POST Data (JSON)
              </label>
              <textarea
                id="postDataInput"
                value={postData}
                onChange={(e) => setPostData(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded px-3 py-2"
                aria-label="POST data in JSON format"
              />
            </div>
          )}
          
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            title="Send API request"
          >
            {loading ? 'Fetching...' : 'Send Request'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 text-red-700 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="mt-4 bg-gray-100 p-4 rounded overflow-auto max-h-60">
          <pre className="text-sm">{response ? JSON.stringify(response, null, 2) : 'No data'}</pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Common Endpoints</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => {
                setMethod('GET');
                setRequestUrl('/api/csrf/');
              }}
              className="text-blue-500 hover:underline"
              title="Get CSRF token"
            >
              /api/csrf/ - Get CSRF token
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setMethod('POST');
                setRequestUrl('/api/counselors/auth/login/');
                setPostData('{\n  "email": "test@example.com",\n  "password": "password123"\n}');
              }}
              className="text-blue-500 hover:underline"
              title="Test counselor login endpoint"
            >
              /api/counselors/auth/login/ - Counselor login endpoint
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setMethod('POST');
                setRequestUrl('/api/auth/login/');
                setPostData('{\n  "username": "test@example.com",\n  "password": "password123"\n}');
              }}
              className="text-blue-500 hover:underline"
              title="Test user login endpoint"
            >
              /api/auth/login/ - User login endpoint
            </button>
          </li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Quick Actions</h2>
        <div className="space-y-2">
          <button
            onClick={handleCounselorLogin}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
            title="Test counselor login and save token in localStorage"
          >
            Test Counselor Login (with localStorage)
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user_type');
              localStorage.removeItem('counselor_id');
              localStorage.removeItem('user_id');
              localStorage.removeItem('name');
              alert('Cleared all authentication data from localStorage');
              window.location.reload();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
            title="Clear all authentication data from localStorage"
          >
            Clear Authentication Data
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-2">Authentication Info</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>Token in localStorage: {typeof window !== 'undefined' && localStorage.getItem('token') ? 'Present' : 'Not found'}</p>
          <p>User type in localStorage: {typeof window !== 'undefined' && localStorage.getItem('user_type')}</p>
          <p>Counselor ID: {typeof window !== 'undefined' && localStorage.getItem('counselor_id')}</p>
          <p>User ID: {typeof window !== 'undefined' && localStorage.getItem('user_id')}</p>
          <p>Name: {typeof window !== 'undefined' && localStorage.getItem('name')}</p>
        </div>
      </div>
    </div>
  );
} 