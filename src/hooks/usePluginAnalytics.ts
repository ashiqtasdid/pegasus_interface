import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from './useUserContext';

export interface PluginUsageStats {
  pluginName: string;
  totalChats: number;
  totalMessages: number;
  lastUsed: Date | null;
  createdAt: Date;
  downloadCount: number;
}

export interface UserPluginAnalytics {
  totalPlugins: number;
  mostUsedPlugin: string | null;
  totalChatSessions: number;
  totalMessages: number;
  pluginsCreatedThisMonth: number;
  usageStats: PluginUsageStats[];
}

export const usePluginAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserPluginAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userContext } = useUserContext();

  const fetchAnalytics = useCallback(async () => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/plugins', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (userContext?.isAuthenticated) {
      fetchAnalytics();
    }
  }, [userContext, fetchAnalytics]);

  const getPluginUsage = useCallback((pluginName: string): PluginUsageStats | null => {
    return analytics?.usageStats.find(stat => stat.pluginName === pluginName) || null;
  }, [analytics]);

  const isNearLimit = useCallback((): boolean => {
    if (!analytics || !userContext?.permissions?.maxPluginsAllowed) return false;
    
    const limit = userContext.permissions.maxPluginsAllowed;
    if (limit === -1) return false; // unlimited
    
    return analytics.totalPlugins >= limit * 0.8; // 80% of limit
  }, [analytics, userContext]);

  const canCreateMorePlugins = useCallback((): boolean => {
    if (!analytics || !userContext?.permissions?.maxPluginsAllowed) return false;
    
    const limit = userContext.permissions.maxPluginsAllowed;
    if (limit === -1) return true; // unlimited
    
    return analytics.totalPlugins < limit;
  }, [analytics, userContext]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
    getPluginUsage,
    isNearLimit,
    canCreateMorePlugins,
  };
};
