'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderOpen,
  Download,
  Search,
  Package,
  CheckCircle,
  Plus
} from 'lucide-react';
import { usePluginList } from '@/hooks/useApi';
import { downloadPluginFile } from '@/lib/api';
import withAuth from '@/components/withAuth';

const PluginCard: React.FC<{
  pluginName: string;
  onDownload: (pluginName: string) => void;
}> = ({ pluginName, onDownload }) => {
  return (
    <div className="card group hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {pluginName}
            </h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500 bg-opacity-20" />
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500 font-medium">
                Ready
              </span>
            </div>
          </div>
          
          <p className="text-[var(--muted-foreground)] text-sm mb-3 line-clamp-2">
            Generated Minecraft plugin
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center space-x-1">
              <Package className="w-3 h-3" />
              <span>Plugin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--muted-foreground)]">
          Ready for download
        </div>
        
        <button
          onClick={() => onDownload(pluginName)}
          className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};

const FilterBar: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
}> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search plugins..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function PluginsPage() {
  const { fetchPlugins, loading, error, data } = usePluginList();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlugins().catch(err => {
      console.error('PluginsPage: fetchPlugins failed:', err);
    });
  }, [fetchPlugins]);

  const handleDownload = async (pluginName: string) => {
    try {
      await downloadPluginFile(pluginName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filteredPlugins = data.filter(pluginName =>
    pluginName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <FolderOpen className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        No Plugins Found
      </h3>
      <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
        {searchTerm 
          ? `No plugins match "${searchTerm}". Try adjusting your search.`
          : "You haven't created any plugins yet. Create your first plugin to get started!"
        }
      </p>
      <a
        href="/create"
        className="btn-primary inline-flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Create Plugin</span>
      </a>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Your Plugins
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Manage and download your generated Minecraft plugins
          </p>
        </div>
        
        <a href="/create" className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Plugin</span>
        </a>
      </div>

      {error && (
        <div className="card border-red-500 bg-red-500 bg-opacity-10">
          <div className="flex items-center space-x-3">
            <div className="text-red-500">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-500">Error Loading Plugins</h3>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="space-y-3">
                <div className="h-6 bg-[var(--secondary)] rounded" />
                <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
                <div className="h-4 bg-[var(--secondary)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[var(--muted-foreground)]">
              {filteredPlugins.length} plugin{filteredPlugins.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((pluginName) => (
              <PluginCard
                key={pluginName}
                pluginName={pluginName}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Export with authentication protection
export default withAuth(PluginsPage);
