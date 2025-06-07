'use client';

import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/hooks/useUserContext';
import { usePluginAnalytics } from '@/hooks/usePluginAnalytics';
import withAuth from '@/components/withAuth';
import { 
  BarChart3, 
  Users, 
  Code, 
  MessageSquare, 
  Download,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalPlugins: number;
  totalChats: number;
  totalDownloads: number;
  activeUsers: number;
  pluginsThisMonth: number;
  chatsToday: number;
  popularPlugins: Array<{
    name: string;
    downloads: number;
    chats: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const { userContext } = useUserContext();
  const { analytics } = usePluginAnalytics();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock system statistics - in real implementation, fetch from API
    const fetchSystemStats = async () => {
      try {
        // TODO: Replace with actual API call
        const mockStats: SystemStats = {
          totalUsers: 156,
          totalPlugins: 423,
          totalChats: 1247,
          totalDownloads: 2891,
          activeUsers: 23,
          pluginsThisMonth: 67,
          chatsToday: 34,
          popularPlugins: [
            { name: 'PvP Arena Manager', downloads: 234, chats: 45 },
            { name: 'Economy Plugin', downloads: 189, chats: 67 },
            { name: 'Custom Commands', downloads: 156, chats: 23 },
            { name: 'World Generator', downloads: 134, chats: 56 },
            { name: 'Anti-Grief System', downloads: 98, chats: 34 },
          ]
        };
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setSystemStats(mockStats);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userContext?.role === 'admin') {
      fetchSystemStats();
    }
  }, [userContext?.role]);

  // Redirect non-admin users
  if (!userContext || userContext.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Access Denied
        </h1>
        <p className="text-[var(--muted-foreground)]">
          You need administrator privileges to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--secondary)] rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card">
                <div className="space-y-3">
                  <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
                  <div className="h-8 bg-[var(--secondary)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            System Analytics
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Overview of system usage and user activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-[var(--primary)]" />
          <span className="text-sm text-[var(--muted-foreground)]">
            Live Dashboard
          </span>
        </div>
      </div>

      {/* System Overview Cards */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Users</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {systemStats.totalUsers}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">{systemStats.activeUsers} active</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Plugins</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {systemStats.totalPlugins}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Calendar className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-500">{systemStats.pluginsThisMonth} this month</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Chats</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {systemStats.totalChats}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Activity className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">{systemStats.chatsToday} today</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Downloads</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {systemStats.totalDownloads}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Download className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-orange-500">+12% this week</span>
            </div>
          </div>
        </div>
      )}

      {/* Popular Plugins */}
      {systemStats && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Popular Plugins
            </h2>
            <BarChart3 className="w-5 h-5 text-[var(--muted-foreground)]" />
          </div>
          
          <div className="space-y-4">
            {systemStats.popularPlugins.map((plugin, index) => (
              <div key={plugin.name} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-[var(--primary)] text-white rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">
                      {plugin.name}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {plugin.chats} chat sessions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[var(--foreground)]">
                    {plugin.downloads}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    downloads
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Analytics (if available) */}
      {analytics && (
        <div className="card">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Your Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">
                {analytics.totalPlugins}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Your Plugins
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">
                {analytics.totalChatSessions}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Chat Sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--primary)]">
                {analytics.totalMessages}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Messages Sent
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AnalyticsPage);
