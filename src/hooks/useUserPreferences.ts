import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from './useUserContext';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  chatSettings: {
    autoSave: boolean;
    maxHistoryDays: number;
    enableNotifications: boolean;
    defaultModel: string;
  };
  pluginSettings: {
    autoCompile: boolean;
    maxPlugins: number;
    defaultPrivacy: 'private' | 'public';
    enableAnalytics: boolean;
  };
  uiSettings: {
    sidebarCollapsed: boolean;
    showAdvancedOptions: boolean;
    compactMode: boolean;
    language: string;
  };
}

export const defaultPreferences: UserPreferences = {
  theme: 'system',
  chatSettings: {
    autoSave: true,
    maxHistoryDays: 30,
    enableNotifications: true,
    defaultModel: 'gpt-4',
  },
  pluginSettings: {
    autoCompile: true,
    maxPlugins: 10,
    defaultPrivacy: 'private',
    enableAnalytics: true,
  },
  uiSettings: {
    sidebarCollapsed: false,
    showAdvancedOptions: false,
    compactMode: false,
    language: 'en',
  },
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userContext } = useUserContext();

  const fetchPreferences = useCallback(async () => {
    if (!userContext?.isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data });
      } else {
        // If no preferences exist, use defaults
        setPreferences(defaultPreferences);
      }
    } catch (err) {
      console.warn('Failed to fetch preferences, using defaults:', err);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const newPreferences = { ...preferences, ...updates };
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setPreferences(newPreferences);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [preferences, userContext]);

  const resetPreferences = useCallback(async () => {
    return await updatePreferences(defaultPreferences);
  }, [updatePreferences]);

  useEffect(() => {
    if (userContext?.isAuthenticated) {
      fetchPreferences();
    }
  }, [userContext, fetchPreferences]);

  // Individual preference updaters for convenience
  const updateTheme = useCallback((theme: UserPreferences['theme']) => {
    return updatePreferences({ theme });
  }, [updatePreferences]);

  const updateChatSettings = useCallback((chatSettings: Partial<UserPreferences['chatSettings']>) => {
    return updatePreferences({
      chatSettings: { ...preferences.chatSettings, ...chatSettings }
    });
  }, [updatePreferences, preferences.chatSettings]);

  const updatePluginSettings = useCallback((pluginSettings: Partial<UserPreferences['pluginSettings']>) => {
    return updatePreferences({
      pluginSettings: { ...preferences.pluginSettings, ...pluginSettings }
    });
  }, [updatePreferences, preferences.pluginSettings]);

  const updateUISettings = useCallback((uiSettings: Partial<UserPreferences['uiSettings']>) => {
    return updatePreferences({
      uiSettings: { ...preferences.uiSettings, ...uiSettings }
    });
  }, [updatePreferences, preferences.uiSettings]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
    updateTheme,
    updateChatSettings,
    updatePluginSettings,
    updateUISettings,
    refreshPreferences: fetchPreferences,
  };
};
