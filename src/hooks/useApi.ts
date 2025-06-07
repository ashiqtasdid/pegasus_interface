import { useState, useCallback } from 'react';
import { apiClient, pollCompilationStatus } from '@/lib/api';
import { useUserContext } from '@/hooks/useUserContext';
import {
  GeneratePluginRequest,
  ChatRequest,
  HealthResponse,
} from '@/types/api';

export const usePluginGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [compilationStatus, setCompilationStatus] = useState<string>('idle');
  const { userContext } = useUserContext();

  const generatePlugin = useCallback(async (request: GeneratePluginRequest) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    setCompilationStatus('pending');

    try {
      const response = await apiClient.generatePlugin(request);
      setData(response);
      setCompilationStatus('compiling');

      // Start polling for compilation status
      if (request.name) {
        pollCompilationStatus(request.name, (status) => {
          setCompilationStatus(status);
        });
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setCompilationStatus('failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setCompilationStatus('idle');
  }, []);

  return { 
    generatePlugin, 
    loading, 
    error, 
    data, 
    compilationStatus, 
    reset,
    userContext 
  };
};

export const usePluginChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<Record<string, unknown>>>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const { userContext } = useUserContext();

  const sendMessage = useCallback(async (request: ChatRequest & { conversationId?: string }) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.chatWithPlugin(request);

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }

      // Update current conversation if provided
      if (response.conversationId) {
        setCurrentConversation(response.conversationId);
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const loadConversations = useCallback(async (pluginName?: string) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getChatHistory(pluginName);
      if (response.success) {
        setConversations(Array.isArray(response.conversations) ? response.conversations : []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getChatHistory(undefined, conversationId);
      if (response.success) {
        setMessages(Array.isArray(response.messages) ? response.messages : []);
        setCurrentConversation(conversationId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.deleteConversation(conversationId);
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        if (currentConversation === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentConversation, userContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentConversation(null);
  }, []);

  return { 
    sendMessage, 
    loadConversations, 
    loadMessages, 
    deleteConversation, 
    clearMessages, 
    loading, 
    error, 
    conversations, 
    messages, 
    currentConversation,
    userContext 
  };
};

export const useUserPlugins = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<string[]>([]);
  const { userContext } = useUserContext();

  const loadPlugins = useCallback(async () => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pluginList = await apiClient.getPlugins();
      setPlugins(Array.isArray(pluginList) ? pluginList : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plugins';
      setError(message);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  const savePlugin = useCallback(async (pluginName: string, pluginData?: Record<string, unknown>, status?: string) => {
    if (!userContext?.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const pluginId = await apiClient.saveUserPlugin(pluginName, pluginData, status);
      // Reload plugins after saving
      await loadPlugins();
      return pluginId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plugin';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userContext, loadPlugins]);

  return { 
    plugins, 
    loading, 
    error, 
    loadPlugins, 
    savePlugin,
    userContext 
  };
};

export const usePluginList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[]>([]);
  const { userContext } = useUserContext();

  const fetchPlugins = useCallback(async () => {
    if (!userContext?.isAuthenticated) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getPlugins();
      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userContext]);

  return { fetchPlugins, loading, error, data, userContext };
};

export const useHealth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);

  const checkHealth = useCallback(async (detailed = false) => {
    setLoading(true);
    setError(null);

    try {
      if (detailed) {
        const response = await apiClient.getDetailedHealth();
        setData(response);
        return response;
      } else {
        const response = await apiClient.getHealth();
        // Convert the basic health response to match HealthResponse format
        const healthData: HealthResponse = {
          status: response.status as 'healthy' | 'degraded' | 'down' | 'ok',
          timestamp: response.timestamp,
          message: response.message,
          uptime: response.uptime,
          version: response.version,
          environment: response.environment
        };
        setData(healthData);
        return healthData;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkHealth, loading, error, data };
};
