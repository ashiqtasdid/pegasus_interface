import {
  ApiResponse,
  GeneratePluginRequest,
  ChatRequest,
  HealthResponse,
} from '@/types/api';
import { getSession } from '@/lib/auth-client';

const API_BASE_URL = '/api'; // Use Next.js API routes instead of direct external API calls

class ApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper method to get current user ID
  protected async getCurrentUserId(): Promise<string | null> {
    try {
      const session = await getSession();
      if (session && session.data && 'user' in session.data) {
        return session.data.user.id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  protected async request<T>(
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

  // Plugin Generation - now user-specific
  async generatePlugin(data: GeneratePluginRequest): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const url = `${this.baseUrl}/generate`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId, // Include userId for user-specific plugin creation
        }),
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

  // Plugin Chat with user-specific context
  async chatWithPlugin(data: ChatRequest & { conversationId?: string }): Promise<{ success: boolean; response?: string; error?: string; messageId?: string; conversationId?: string; operations?: Array<Record<string, unknown>>; compilationResult?: Record<string, unknown> }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const url = `${this.baseUrl}/chat/send`;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for chat
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId, // Include userId for user-specific plugin access
        }),
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
      return result;
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

  // Chat history management
  async getChatHistory(pluginName?: string, conversationId?: string): Promise<Record<string, unknown>> {
    try {
      const params = new URLSearchParams();
      if (pluginName) params.append('pluginName', pluginName);
      if (conversationId) params.append('conversationId', conversationId);
      
      const response = await fetch(`${this.baseUrl}/chat/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get chat history:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/history?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // User plugins management
  async getUserPlugins(): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await fetch(`${this.baseUrl}/plugins/user`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.plugins || [];
    } catch (error) {
      console.error('Failed to get user plugins:', error);
      throw error;
    }
  }

  async saveUserPlugin(pluginName: string, pluginData?: Record<string, unknown>, status?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/plugins/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pluginName, pluginData, status }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.pluginId;
    } catch (error) {
      console.error('Failed to save user plugin:', error);
      throw error;
    }
  }

  // Plugin Management - now user-specific
  async getPlugins(): Promise<string[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const url = `${this.baseUrl}/plugins?userId=${encodeURIComponent(userId)}`;
      
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

  // Download Plugin - now user-specific
  async downloadPlugin(pluginName: string): Promise<Blob> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/download/${pluginName}?userId=${encodeURIComponent(userId)}`);
      
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
      const url = `${this.baseUrl}/health/detailed`;
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

  // System Health
  async getSystemHealth(): Promise<Record<string, unknown>> {
    try {
      const url = `${this.baseUrl}/health/system`;
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
      console.error('System health check failed:', error);
      throw error;
    }
  }

  // Health Metrics
  async getHealthMetrics(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/metrics`;
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
      console.error('Health metrics check failed:', error);
      throw error;
    }
  }

  // Health Trends
  async getHealthTrends(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/trends`;
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
      console.error('Health trends check failed:', error);
      throw error;
    }
  }

  // Service-specific Health Trends
  async getServiceHealthTrends(serviceName: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/trends/${serviceName}`;
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
      console.error('Service health trends check failed:', error);
      throw error;
    }
  }

  // Circuit Breakers
  async getCircuitBreakers(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/circuit-breakers`;
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
      console.error('Circuit breakers check failed:', error);
      throw error;
    }
  }

  // Readiness and Liveness probes
  async getReadinessProbe(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/ready`;
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
      console.error('Readiness probe failed:', error);
      throw error;
    }
  }

  async getLivenessProbe(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/live`;
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
      console.error('Liveness probe failed:', error);
      throw error;
    }
  }

  // Ping endpoint
  async ping(): Promise<any> {
    try {
      const url = `${this.baseUrl}/health/ping`;
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
      console.error('Ping failed:', error);
      throw error;
    }
  }

  // Optimization Stats
  async getOptimizationStats(): Promise<any> {
    try {
      const url = `${this.baseUrl}/optimization-stats`;
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
      console.error('Optimization stats failed:', error);
      throw error;
    }
  }

  // Clear Cache
  async clearCache(): Promise<any> {
    try {
      const url = `${this.baseUrl}/clear-cache`;
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
      console.error('Clear cache failed:', error);
      throw error;
    }
  }
}

// Enhanced API client with rate limiting and simple caching
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class EnhancedApiClient extends ApiClient {
  private requestCounts = new Map<string, number[]>();
  private cache = new Map<string, CacheEntry<any>>();
  
  private rateLimitConfig: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  };

  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;
    
    if (!this.requestCounts.has(userId)) {
      this.requestCounts.set(userId, []);
    }
    
    const userRequests = this.requestCounts.get(userId)!;
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requestCounts.set(userId, recentRequests);
    
    if (recentRequests.length >= this.rateLimitConfig.maxRequests) {
      throw new Error(`Rate limit exceeded. Maximum ${this.rateLimitConfig.maxRequests} requests per minute.`);
    }
    
    recentRequests.push(now);
    return true;
  }

  private getCacheKey(endpoint: string, options?: RequestInit): string {
    return `${endpoint}_${JSON.stringify(options || {})}`;
  }

  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  async cachedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTtl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isValidCacheEntry(cached)) {
        return cached.data;
      }
    }

    // Check rate limit
    try {
      const userId = await this.getCurrentUserId();
      if (userId) {
        await this.checkRateLimit(userId);
      }
    } catch (error) {
      console.warn('Rate limit check failed:', error);
    }

    const response = await this.request<T>(endpoint, options);
    
    // Cache successful GET responses
    if (response.success && (!options.method || options.method === 'GET')) {
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        ttl: cacheTtl,
      });
    }
    
    return response;
  }

  // Clear cache for specific patterns
  invalidateCache(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (typeof key === 'string' && key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // Clean expired cache entries
  cleanExpiredCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidCacheEntry(entry)) {
        this.cache.delete(key);
      }
    }
  }

  // Enhanced plugin management methods
  async deletePlugin(pluginName: string): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await this.checkRateLimit(userId);

      const response = await fetch(`${this.baseUrl}/plugins?pluginName=${encodeURIComponent(pluginName)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Invalidate plugin-related cache
      this.invalidateCache('plugins');
      
      return result;
    } catch (error) {
      console.error('Failed to delete plugin:', error);
      throw error;
    }
  }

  async togglePluginVisibility(pluginName: string, isVisible: boolean): Promise<{ success: boolean; message: string; pluginName: string; isVisible: boolean }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await this.checkRateLimit(userId);

      const response = await fetch(`${this.baseUrl}/plugins`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pluginName,
          isVisible,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Invalidate plugin-related cache
      this.invalidateCache('plugins');
      
      return result;
    } catch (error) {
      console.error('Failed to toggle plugin visibility:', error);
      throw error;
    }
  }

  // Enhanced analytics methods
  async getPluginAnalytics(): Promise<any> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await this.cachedRequest<any>(
        '/analytics/plugins',
        {},
        10 * 60 * 1000 // Cache for 10 minutes
      );

      return response;
    } catch (error) {
      console.error('Failed to get plugin analytics:', error);
      throw error;
    }
  }

  async getUserActivity(): Promise<any> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await this.cachedRequest<any>(
        '/audit/activity',
        {},
        5 * 60 * 1000 // Cache for 5 minutes
      );

      return response;
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  async getUserPreferences(): Promise<any> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await this.cachedRequest<any>(
        '/user/preferences',
        {},
        15 * 60 * 1000 // Cache for 15 minutes
      );

      return response;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(preferences: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await this.checkRateLimit(userId);

      const response = await fetch(`${this.baseUrl}/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Invalidate preferences cache
      this.invalidateCache('preferences');
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export enhanced client instance
export const enhancedApiClient = new EnhancedApiClient();

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
