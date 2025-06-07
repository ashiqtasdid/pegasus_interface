'use client';

import React from 'react';
import { EnhancedPluginManager } from '@/components/EnhancedPluginManager';
import { useUserContext } from '@/hooks/useUserContext';
import withAuth from '@/components/withAuth';

const PluginsPage: React.FC = () => {
  const { userContext } = useUserContext();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Your Plugins
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Manage and download your generated Minecraft plugins with advanced features
          </p>
          {userContext && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-[var(--muted-foreground)]">
                Welcome back, {userContext.displayName} | Role: {userContext.role}
              </span>
            </div>
          )}
        </div>
      </div>

      <EnhancedPluginManager />
    </div>
  );
}

// Export with authentication protection
export default withAuth(PluginsPage);
