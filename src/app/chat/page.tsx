'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings,
  Loader2
} from 'lucide-react';
import { useUserPlugins } from '@/hooks/useApi';
import { AdvancedChat } from '@/components/AdvancedChat';
import withAuth from '@/components/withAuth';

const ChatInterface: React.FC = () => {
  const { loadUserPlugins, plugins } = useUserPlugins();
  const [selectedPlugin, setSelectedPlugin] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await loadUserPlugins();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load user plugins:', error);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [loadUserPlugins]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          <span className="text-[var(--muted-foreground)]">Loading chat interface...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center justify-center space-x-3">
          <MessageSquare className="w-8 h-8 text-[var(--primary)]" />
          <span>Chat with AI</span>
        </h1>
        <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
          Have a conversation with our AI assistant about your generated plugins, get help with development, 
          or ask questions about Minecraft plugin creation.
        </p>
      </div>

      {/* Plugin Selection */}
      {plugins.length > 0 && !selectedPlugin && (
        <div className="card">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center space-x-2">
            <Settings className="w-6 h-6" />
            <span>Select a Plugin</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin: any) => (
              <div
                key={plugin._id}
                onClick={() => setSelectedPlugin(plugin.name)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <h4 className="font-semibold text-[var(--foreground)] mb-2">{plugin.name}</h4>
                <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                  {plugin.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span className={`px-2 py-1 rounded-full ${
                    plugin.status === 'compiled' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    plugin.status === 'generated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {plugin.status || 'unknown'}
                  </span>
                  <span>{new Date(plugin.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plugins.length === 0 && isInitialized && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No Plugins Yet
          </h3>
          <p className="text-[var(--muted-foreground)] mb-4">
            You haven't generated any plugins yet. Create your first plugin to start chatting!
          </p>
          <a
            href="/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Create Your First Plugin
          </a>
        </div>
      )}

      {/* Chat Component */}
      <div className="card">
        {selectedPlugin && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Chatting about: {selectedPlugin}
            </h3>
            <button
              onClick={() => setSelectedPlugin('')}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
            >
              Switch Plugin
            </button>
          </div>
        )}
        <AdvancedChat
          selectedPlugin={selectedPlugin}
          onPluginChange={setSelectedPlugin}
          compact={false}
        />
      </div>

      {/* Help Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>How to Use</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-[var(--foreground)]">General Chat</h4>
            <ul className="text-[var(--muted-foreground)] space-y-1">
              <li>• Ask about plugin development concepts</li>
              <li>• Get help with Minecraft APIs</li>
              <li>• Request code explanations</li>
              <li>• Discuss best practices</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-[var(--foreground)]">Plugin-Specific Chat</h4>
            <ul className="text-[var(--muted-foreground)] space-y-1">
              <li>• Select a generated plugin to discuss it specifically</li>
              <li>• Request modifications or improvements</li>
              <li>• Ask about plugin functionality</li>
              <li>• Get debugging help</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(ChatInterface);
