import { getSession } from '@/lib/auth-client';

export interface UserActivity {
  userId: string;
  action: string;
  resourceType: 'plugin' | 'chat' | 'user';
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class ActivityLogger {
  private static instance: ActivityLogger;
  private activities: UserActivity[] = [];

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  async logActivity(
    action: string,
    resourceType: UserActivity['resourceType'],
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const session = await getSession();
      if (!session?.data?.user?.id) return;

      const activity: UserActivity = {
        userId: session.data.user.id,
        action,
        resourceType,
        resourceId,
        metadata,
        timestamp: new Date(),
      };

      this.activities.push(activity);

      // Send to backend for persistence
      await this.persistActivity(activity);
    } catch (error) {
      console.warn('Failed to log user activity:', error);
    }
  }

  private async persistActivity(activity: UserActivity): Promise<void> {
    try {
      await fetch('/api/audit/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });
    } catch (error) {
      console.warn('Failed to persist activity:', error);
    }
  }

  // Plugin-specific logging methods
  async logPluginCreated(pluginName: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.logActivity('plugin.created', 'plugin', pluginName, metadata);
  }

  async logPluginAccessed(pluginName: string): Promise<void> {
    await this.logActivity('plugin.accessed', 'plugin', pluginName);
  }

  async logPluginDownloaded(pluginName: string): Promise<void> {
    await this.logActivity('plugin.downloaded', 'plugin', pluginName);
  }

  async logChatStarted(pluginName: string, conversationId?: string): Promise<void> {
    await this.logActivity('chat.started', 'chat', conversationId, { pluginName });
  }

  async logChatMessage(pluginName: string, conversationId?: string): Promise<void> {
    await this.logActivity('chat.message_sent', 'chat', conversationId, { pluginName });
  }
}

export const activityLogger = ActivityLogger.getInstance();
