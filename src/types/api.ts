// Type definitions for the Pegasus Nest API

export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  mainClass: string;
  sourceCode: string;
  compilationStatus: 'pending' | 'compiling' | 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  downloadUrl?: string;
  errors?: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  message: string;
  response: string;
  timestamp: Date;
  pluginName: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface GeneratePluginRequest {
  prompt: string;
  name: string; // Now required according to API docs
  description?: string;
  author?: string;
  version?: string;
  mainClass?: string;
}

export interface GeneratePluginResponse {
  pluginName: string;
  generatedCode: string;
  compilationStatus: 'pending' | 'compiling' | 'success' | 'failed';
  downloadUrl?: string;
  errors?: string[];
}

export interface ChatRequest {
  message: string;
  pluginName: string; // Changed from 'name' to 'pluginName' to match component usage
  conversationId?: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

export interface PluginListResponse {
  plugins: Array<{
    name: string;
    description: string;
    author: string;
    version: string;
    createdAt: string;
    compilationStatus: string;
    downloadUrl: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down' | 'ok';
  timestamp: string;
  message?: string;
  uptime?: number;
  version?: string;
  environment?: string;
  services?: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errors: any[];
  }>;
  system?: {
    platform: string;
    arch: string;
    nodeVersion: string;
    pid: number;
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
    metrics: any;
  };
  recommendations?: string[];
}
