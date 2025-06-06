'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings,
  Loader2
} from 'lucide-react';
import { usePluginList } from '@/hooks/useApi';
import { ChatComponent } from '@/components/ChatComponent';

const ChatInterface: React.FC = () => {
  const { fetchPlugins, data: availablePlugins } = usePluginList();
  const [selectedPlugin, setSelectedPlugin] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await fetchPlugins();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load plugins:', error);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [fetchPlugins]);

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
          Have a conversation with our AI assistant about your plugins, get help with development, 
          or ask questions about Minecraft plugin creation.
        </p>
      </div>

      {/* Chat Component */}
      <div className="card">
        <ChatComponent
          selectedPlugin={selectedPlugin}
          onPluginChange={setSelectedPlugin}
          availablePlugins={availablePlugins}
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
              <li>• Select a plugin to discuss it specifically</li>
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

export default ChatInterface;
