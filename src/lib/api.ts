import {
  ApiResponse,
  GeneratePluginRequest,
  GeneratePluginResponse,
  ChatRequest,
  ChatResponse,
  PluginListResponse,
  HealthResponse,
} from '@/types/api';

const API_BASE_URL = '/api'; // Use Next.js API routes instead of direct external API calls

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Plugin Generation
  async generatePlugin(data: GeneratePluginRequest): Promise<string> {
    try {
      const url = `${this.baseUrl}/generate`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.message;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Plugin generation timed out. The AI service may be experiencing high load. Please try again later.');
      }
      console.error('Plugin generation failed:', error);
      throw error;
    }
  }

  // Plugin Chat
  async chatWithPlugin(data: ChatRequest): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/chat`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for chat
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        };
      }

      const result = await response.json();
      return result; // API now returns { success, response?, error? }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Chat request timed out. The AI service may be experiencing high load. Please try again later.'
        };
      }
      console.error('Chat failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Plugin Management
  async getPlugins(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/plugins`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      throw error;
    }
  }

  // Download Plugin
  async downloadPlugin(pluginName: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${pluginName}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Health Checks
  async getHealth(): Promise<{ status: string; timestamp: string; message?: string; uptime?: number; version?: string; environment?: string }> {
    try {
      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async getDetailedHealth(): Promise<HealthResponse> {
    try {
      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Detailed health check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Utility functions
export const downloadPluginFile = async (pluginName: string) => {
  try {
    const blob = await apiClient.downloadPlugin(pluginName);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pluginName}.jar`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export const pollCompilationStatus = (
  pluginName: string,
  onUpdate: (status: string) => void,
  interval = 2000
) => {
  const poll = async () => {
    try {
      const plugins = await apiClient.getPlugins();
      
      // Since we only have plugin names, we'll assume the plugin exists if it's in the list
      if (plugins.includes(pluginName)) {
        onUpdate('success'); // Plugin exists, so it's compiled
        return; // Stop polling
      } else {
        onUpdate('compiling'); // Plugin not in list yet, still compiling
      }
    } catch (error) {
      console.error('Polling error:', error);
      onUpdate('failed');
      return; // Stop polling on error
    }

    setTimeout(poll, interval);
  };

  poll();
};
