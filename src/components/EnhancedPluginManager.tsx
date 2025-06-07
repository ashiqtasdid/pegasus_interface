import React, { useState, useEffect } from 'react';
import { useUserContext, UserPermissions } from '@/hooks/useUserContext';
import { usePluginAnalytics } from '@/hooks/usePluginAnalytics';
import { activityLogger } from '@/utils/activityLogger';
import { handleApiError } from '@/utils/errorHandling';

interface Plugin {
  name: string;
  createdAt: Date;
  lastUsed?: Date;
  size?: number;
  status: 'active' | 'archived' | 'error';
  isPublic?: boolean;
}

interface PluginCardProps {
  plugin: Plugin;
  onDownload: (pluginName: string) => void;
  onDelete: (pluginName: string) => void;
  onToggleVisibility: (pluginName: string, isPublic: boolean) => void;
  onArchive: (pluginName: string) => void;
  userPermissions: UserPermissions;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onDownload,
  onDelete,
  onToggleVisibility,
  onArchive,
  userPermissions,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
          <p className="text-sm text-gray-500">
            Created: {plugin.createdAt.toLocaleDateString()}
          </p>
          {plugin.lastUsed && (
            <p className="text-sm text-gray-500">
              Last used: {plugin.lastUsed.toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            plugin.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : plugin.status === 'archived'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {plugin.status}
          </span>
          {plugin.isPublic && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Public
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDownload(plugin.name)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Download
        </button>
        
        {Boolean(userPermissions?.canDeletePlugins) && (
          <>
            <button
              onClick={() => onArchive(plugin.name)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              {plugin.status === 'archived' ? 'Unarchive' : 'Archive'}
            </button>
            
            <button
              onClick={() => onToggleVisibility(plugin.name, !plugin.isPublic)}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              {plugin.isPublic ? 'Make Private' : 'Make Public'}
            </button>
            
            <button
              onClick={() => onDelete(plugin.name)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const EnhancedPluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { userContext } = useUserContext();
  const { analytics, isNearLimit, canCreateMorePlugins } = usePluginAnalytics();

  // Initialize with mock plugins
  useEffect(() => {
    const initializePlugins = () => {
      const mockPlugins: Plugin[] = [
        {
          name: 'EconomyManager',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          size: 2500,
          status: 'active',
          isPublic: true,
        },
        {
          name: 'CustomEvents',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          size: 1800,
          status: 'active',
          isPublic: false,
        },
        {
          name: 'PlayerTracker',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          size: 3200,
          status: 'archived',
          isPublic: true,
        },
      ];
      setPlugins(mockPlugins);
      setLoading(false);
    };

    // Simulate API call delay
    const timer = setTimeout(initializePlugins, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async (pluginName: string) => {
    try {
      await activityLogger.logPluginDownloaded(pluginName);
      
      const response = await fetch(`/api/download/${pluginName}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluginName}.jar`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(handleApiError(err, 'Download'));
    }
  };

  const handleDelete = async (pluginName: string) => {
    if (!confirm(`Are you sure you want to delete "${pluginName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // TODO: Implement delete API endpoint
      await activityLogger.logActivity('plugin.deleted', 'plugin', pluginName);
      setPlugins(prev => prev.filter(p => p.name !== pluginName));
    } catch (err) {
      setError(handleApiError(err, 'Delete'));
    }
  };

  const handleToggleVisibility = async (pluginName: string, isPublic: boolean) => {
    try {
      // TODO: Implement visibility toggle API
      await activityLogger.logActivity(
        isPublic ? 'plugin.made_public' : 'plugin.made_private',
        'plugin',
        pluginName
      );
      setPlugins(prev => prev.map(p => 
        p.name === pluginName ? { ...p, isPublic } : p
      ));
    } catch (err) {
      setError(handleApiError(err, 'Visibility Toggle'));
    }
  };

  const handleArchive = async (pluginName: string) => {
    try {
      const plugin = plugins.find(p => p.name === pluginName);
      const newStatus = plugin?.status === 'archived' ? 'active' : 'archived';
      
      await activityLogger.logActivity(
        newStatus === 'archived' ? 'plugin.archived' : 'plugin.unarchived',
        'plugin',
        pluginName
      );
      
      setPlugins(prev => prev.map(p => 
        p.name === pluginName ? { ...p, status: newStatus } : p
      ));
    } catch (err) {
      setError(handleApiError(err, 'Archive'));
    }
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesFilter = filter === 'all' || plugin.status === filter;
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!userContext?.isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to manage your plugins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Plugin Manager</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{analytics?.totalPlugins || 0}</div>
            <div className="text-sm opacity-90">Total Plugins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{analytics?.totalChatSessions || 0}</div>
            <div className="text-sm opacity-90">Chat Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{analytics?.pluginsCreatedThisMonth || 0}</div>
            <div className="text-sm opacity-90">Created This Month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {userContext.permissions.maxPluginsAllowed === -1 ? '∞' : userContext.permissions.maxPluginsAllowed}
            </div>
            <div className="text-sm opacity-90">Plugin Limit</div>
          </div>
        </div>
      </div>

      {/* Usage warnings */}
      {isNearLimit() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div>
              <p className="text-yellow-800 font-medium">Approaching Plugin Limit</p>
              <p className="text-yellow-700 text-sm">
                You&apos;re using {analytics?.totalPlugins} of your {userContext.permissions.maxPluginsAllowed} allowed plugins.
              </p>
            </div>
          </div>
        </div>
      )}

      {!canCreateMorePlugins() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">🚫</div>
            <div>
              <p className="text-red-800 font-medium">Plugin Limit Reached</p>
              <p className="text-red-700 text-sm">
                You&apos;ve reached your plugin limit. Delete or archive some plugins to create new ones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex space-x-2">
          {['all', 'active', 'archived'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as 'all' | 'active' | 'archived')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search plugins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Plugin grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading plugins...</p>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchTerm ? 'No plugins found matching your search.' : 'No plugins found.'}
          </p>
          {!searchTerm && (
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create Your First Plugin
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.name}
              plugin={plugin}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
              onArchive={handleArchive}
              userPermissions={userContext.permissions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
