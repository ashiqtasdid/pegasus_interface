'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  timestamp?: string;
}

export default function ServiceStatus() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Use the Next.js API route instead of direct external API call
        const response = await fetch('/api/health');
        const data = await response.json();
        
        setHealth({
          status: data.status === 'healthy' ? 'healthy' : 'degraded',
          message: data.message,
          timestamp: data.timestamp
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth({
          status: 'down',
          message: 'Unable to connect to API services'
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  if (!health || health.status === 'healthy') return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'degraded':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'down':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getStatusColor(health.status)}`}>
      <div className="flex items-center space-x-2 mb-2">
        {getStatusIcon(health.status)}
        <h3 className="font-semibold text-sm">Service Status</h3>
      </div>
      <p className="text-sm mb-3">{health.message}</p>
      
      {health.status === 'degraded' && (
        <p className="text-xs mt-2 opacity-75">
          Some features may be slower than usual. Please be patient while we resolve the issues.
        </p>
      )}
      
      {health.status === 'down' && (
        <p className="text-xs mt-2 opacity-75">
          Services are currently unavailable. Please try again later.
        </p>
      )}
    </div>
  );
}
