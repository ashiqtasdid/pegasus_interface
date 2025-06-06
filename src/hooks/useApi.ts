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
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    response: string;
    timestamp: Date;
  }>>([]);

  const sendMessage = useCallback(async (request: ChatRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.chatWithPlugin(request);

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }

      if (response.response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          message: request.message,
          response: response.response!,
          timestamp: new Date(),
        }]);
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { sendMessage, loading, error, messages, clearMessages };
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
