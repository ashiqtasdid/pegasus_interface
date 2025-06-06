'use client';

import React, { useEffect, useState } from 'react';
import {
  Heart,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { useHealth } from '@/hooks/useApi';

const StatusBadge: React.FC<{
  status: 'up' | 'down' | 'ok' | 'degraded' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const getConfig = () => {
    switch (status) {
      case 'up':
      case 'ok':
        return { color: 'text-green-500', bg: 'bg-green-500', icon: CheckCircle, label: 'Healthy' };
      case 'degraded':
        return { color: 'text-yellow-500', bg: 'bg-yellow-500', icon: AlertCircle, label: 'Degraded' };
      case 'down':
        return { color: 'text-red-500', bg: 'bg-red-500', icon: XCircle, label: 'Down' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-500', icon: AlertCircle, label: 'Unknown' };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-sm',
    lg: 'w-5 h-5 text-base'
  };

  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${config.bg} ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : ''}`} />
      <Icon className={`${config.color} ${sizeClasses[size]}`} />
      <span className={`${config.color} font-medium ${sizeClasses[size]}`}>
        {config.label}
      </span>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subvalue?: string;
  icon: React.ElementType;
  status?: 'up' | 'down' | 'ok' | 'degraded' | 'unknown';
  trend?: 'up' | 'down' | 'stable';
}> = ({ title, value, subvalue, icon: Icon, status, trend }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
        {subvalue && (
          <div className="text-sm text-[var(--muted-foreground)]">{subvalue}</div>
        )}
      </div>
    </div>
  );
};

const ServiceCard: React.FC<{
  name: string;
  status: 'up' | 'down';
  responseTime?: number;
  details?: any;
  icon: React.ElementType;
}> = ({ name, status, responseTime, details, icon: Icon }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${status === 'up' ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10'}`}>
            <Icon className={`w-5 h-5 ${status === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{name}</h3>
            {responseTime && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Response time: {responseTime}ms
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {details && (
        <div className="space-y-2 text-sm">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-[var(--muted-foreground)] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="text-[var(--foreground)] font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export default function HealthPage() {
  const { checkHealth, loading, error, data } = useHealth();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        await checkHealth(true); // Get detailed health
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      }
    };

    fetchHealthData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkHealth, autoRefresh]);

  const handleRefresh = async () => {
    try {
      await checkHealth(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh health data:', error);
    }
  };

  const getOverallStatus = () => {
    if (!data) return 'unknown';
    return data.status || 'unknown';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            System Health
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Monitor the status of Pegasus Nest API and its services
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-[var(--muted-foreground)]">Auto-refresh</span>
          </label>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-500 bg-red-500 bg-opacity-10">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">Connection Error</h3>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div className="card bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] border-0 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">API Status</h2>
              <p className="text-blue-100">
                {lastUpdated 
                  ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                  : 'Checking status...'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              {overallStatus === 'ok' ? 'Healthy' : 
               overallStatus === 'degraded' ? 'Degraded' : 
               overallStatus === 'down' ? 'Down' : 'Unknown'}
            </div>
            <div className="flex items-center space-x-2 text-blue-100">
              {overallStatus === 'ok' && <CheckCircle className="w-5 h-5" />}
              {overallStatus === 'degraded' && <AlertCircle className="w-5 h-5" />}
              {overallStatus === 'down' && <XCircle className="w-5 h-5" />}
              <span>All systems {overallStatus === 'ok' ? 'operational' : 'monitored'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Uptime"
            value={data.uptime ? formatUptime(data.uptime) : 'N/A'}
            icon={Clock}
            status="ok"
          />
          
          <MetricCard
            title="Memory Usage"
            value={data.memory ? `${data.memory.percentage}%` : 'N/A'}
            subvalue={data.memory ? `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}` : undefined}
            icon={HardDrive}
            status={data.memory && data.memory.percentage > 90 ? 'degraded' : data.memory && data.memory.percentage > 95 ? 'down' : 'ok'}
          />
          
          <MetricCard
            title="Services"
            value={data.services ? Object.values(data.services).filter(s => s.status === 'up').length : 0}
            subvalue={data.services ? `of ${Object.keys(data.services).length} running` : undefined}
            icon={Server}
            status="ok"
          />
          
          <MetricCard
            title="API Response"
            value={loading ? 'Checking...' : 'Healthy'}
            icon={Activity}
            status={loading ? 'unknown' : 'ok'}
          />
        </div>
      )}

      {/* Services Status */}
      {data?.services && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Service Health
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.services.database && (
              <ServiceCard
                name="Database"
                status={data.services.database.status}
                responseTime={data.services.database.responseTime}
                icon={Database}
              />
            )}
            
            {data.services.geminiAI && (
              <ServiceCard
                name="Gemini AI"
                status={data.services.geminiAI.status}
                responseTime={data.services.geminiAI.responseTime}
                icon={Zap}
              />
            )}
            
            {data.services.compiler && (
              <ServiceCard
                name="Java Compiler"
                status={data.services.compiler.status}
                details={data.services.compiler.jdkVersion ? { jdkVersion: data.services.compiler.jdkVersion } : undefined}
                icon={Cpu}
              />
            )}
          </div>
        </div>
      )}

      {/* API Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center space-x-2">
          <Server className="w-5 h-5" />
          <span>API Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Endpoint:</span>
              <span className="text-[var(--foreground)] font-mono">http://37.114.41.124:3000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Version:</span>
              <span className="text-[var(--foreground)]">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Environment:</span>
              <span className="text-[var(--foreground)]">Production</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Protocol:</span>
              <span className="text-[var(--foreground)]">HTTP/1.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Rate Limit:</span>
              <span className="text-[var(--foreground)]">10 req/min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Documentation:</span>
              <a href="/api-docs" className="text-[var(--primary)] hover:underline">
                View API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
