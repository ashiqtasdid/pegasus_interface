'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import withAuth from '@/components/withAuth';

function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHealth();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDetailedHealth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getDetailedHealth();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testPlugins = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getPlugins();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testHealth}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4"
          >
            Test Basic Health
          </button>
          
          <button
            onClick={testDetailedHealth}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-4"
          >
            Test Detailed Health
          </button>
          
          <button
            onClick={testPlugins}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded mr-4"
          >
            Test Get Plugins
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {loading ? 'Loading...' : result || 'Click a button to test the API'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Export with authentication protection
export default withAuth(TestPage);
