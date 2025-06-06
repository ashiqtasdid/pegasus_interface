'use client';

import React, { useState } from 'react';
import withAuth from '@/components/withAuth';

function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectFetch = async () => {
    console.log('Testing direct fetch...');
    setLoading(true);
    setError(null);
    
    try {
      const url = 'http://37.114.41.124:3000/create/plugins';
      console.log('Making fetch to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    console.log('Testing health endpoint...');
    setLoading(true);
    setError(null);
    
    try {
      const url = 'http://37.114.41.124:3000/health';
      console.log('Making health check to:', url);
      
      const response = await fetch(url);
      
      console.log('Health response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Health response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Health error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testServerSide = async () => {
    console.log('Testing server-side API route...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-plugins');
      
      console.log('Server-side response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server-side response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Server-side error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testProxyAPI = async () => {
    console.log('Testing proxy API routes...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/plugins');
      
      console.log('Proxy API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Proxy API response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Proxy API error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug API Calls</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testDirectFetch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Client-Side Direct Fetch'}
        </button>
        
        <button 
          onClick={testHealth}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
        >
          {loading ? 'Loading...' : 'Test Client-Side Health'}
        </button>

        <button 
          onClick={testServerSide}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
        >
          {loading ? 'Loading...' : 'Test Server-Side API Route'}
        </button>

        <button 
          onClick={testProxyAPI}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
        >
          {loading ? 'Loading...' : 'Test Proxy API'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Export with authentication protection
export default withAuth(DebugPage);
