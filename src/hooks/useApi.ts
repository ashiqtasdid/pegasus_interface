import { useState, useCallback } from 'react';
import { apiClient, pollCompilationStatus } from '@/lib/api';
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

  const generatePlugin = useCallback(async (request: GeneratePluginRequest) => {
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
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setCompilationStatus('idle');
  }, []);

  return { generatePlugin, loading, error, data, compilationStatus, reset };
};

export const usePluginChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const sendMessage = useCallback(async (request: ChatRequest & { conversationId?: string }) => {
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
  }, []);

  const loadConversations = useCallback(async (pluginName?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getChatHistory(pluginName);
      if (response.success) {
        setConversations(response.conversations || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getChatHistory(undefined, conversationId);
      if (response.success) {
        setMessages(response.messages || []);
        setCurrentConversation(conversationId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
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
  }, [currentConversation]);

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
    currentConversation 
  };
};

export const useUserPlugins = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<any[]>([]);

  const loadUserPlugins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userPlugins = await apiClient.getUserPlugins();
      setPlugins(userPlugins);
      return userPlugins;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user plugins';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const savePlugin = useCallback(async (pluginName: string, pluginData?: any, status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const pluginId = await apiClient.saveUserPlugin(pluginName, pluginData, status);
      await loadUserPlugins(); // Refresh the list
      return pluginId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plugin';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserPlugins]);

  return { loadUserPlugins, savePlugin, loading, error, plugins };
};

export const usePluginList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[]>([]);

  const fetchPlugins = useCallback(async () => {
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
  }, []);

  return { fetchPlugins, loading, error, data };
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
