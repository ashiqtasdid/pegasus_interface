'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import withAuth from '@/components/withAuth';
import { 
  TestTube, 
  Activity, 
  Server, 
  Database, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Play,
  Code,
  Zap
} from 'lucide-react';

const TestPage: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<string>('');

  const testHealth = async () => {
    setLoading(true);
    setTestType('health');
    try {
      const response = await apiClient.getHealth();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setTestType('');
    }
  };

  const testDetailedHealth = async () => {
    setLoading(true);
    setTestType('detailed');
    try {
      const response = await apiClient.getDetailedHealth();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setTestType('');
    }
  };

  const testPlugins = async () => {
    setLoading(true);
    setTestType('plugins');
    try {
      const response = await apiClient.getPlugins();
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setTestType('');
    }
  };

  const TestButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    color, 
    isActive 
  }: { 
    onClick: () => void; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
    color: string;
    isActive: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`glass-card group hover:scale-105 transition-all duration-300 p-6 text-left border-2 ${
        isActive 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-transparent hover:border-blue-300/50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {loading && isActive ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Icon className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">{label}</h3>
          <p className="text-[var(--muted-foreground)] text-sm">
            {isActive && loading ? 'Testing...' : 'Click to test this endpoint'}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="floating-element mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg">
              <TestTube className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            API Test Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Test and validate API endpoints to ensure everything is working correctly
          </p>
        </div>

        {/* Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <TestButton
            onClick={testHealth}
            icon={Activity}
            label="Basic Health Check"
            color="from-green-500 to-green-600"
            isActive={testType === 'health'}
          />
          
          <TestButton
            onClick={testDetailedHealth}
            icon={Server}
            label="Detailed Health"
            color="from-blue-500 to-blue-600"
            isActive={testType === 'detailed'}
          />
          
          <TestButton
            onClick={testPlugins}
            icon={Database}
            label="Plugin Data"
            color="from-purple-500 to-purple-600"
            isActive={testType === 'plugins'}
          />
        </div>

        {/* Results Panel */}
        <div className="glass-card">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Test Results</h2>
            </div>
            
            <div className="bg-gray-900/50 dark:bg-gray-950/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200/20 dark:border-gray-700/30">
              {loading ? (
                <div className="flex items-center justify-center space-x-3 py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-[var(--muted-foreground)]">Running test...</span>
                </div>
              ) : result ? (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    {result.includes('Error') ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <span className={`font-medium ${result.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                      {result.includes('Error') ? 'Test Failed' : 'Test Passed'}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-green-400 overflow-auto max-h-96">
                    {result}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                  <p className="text-[var(--muted-foreground)]">
                    Click a test button above to see the API response
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Performance</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Monitor API response times and system performance metrics during testing.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Server className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Connectivity</h3>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Verify that all backend services are running and accessible through the API.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl floating-element" />
        <div className="fixed bottom-20 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl floating-element" />
      </div>
    </div>
  );
}

// Export with authentication protection
export default withAuth(TestPage);
