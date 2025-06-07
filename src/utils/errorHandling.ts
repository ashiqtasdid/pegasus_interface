// Enhanced error handling utilities for user-specific operations
export class UserAuthError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 401) {
    super(message);
    this.name = 'UserAuthError';
  }
}

export class PluginAccessError extends Error {
  constructor(message: string, public pluginName: string, public userId: string) {
    super(message);
    this.name = 'PluginAccessError';
  }
}

export const handleApiError = (error: unknown, context: string = 'API'): string => {
  console.error(`${context} Error:`, error);
  
  if (error instanceof UserAuthError) {
    return error.message;
  }
  
  if (error instanceof PluginAccessError) {
    return `Access denied to plugin "${error.pluginName}": ${error.message}`;
  }
  
  // Handle errors with response property (e.g., fetch errors)
  if (error && typeof error === 'object' && 'response' in error) {
    const errorWithResponse = error as { response: { status: number } };
    if (errorWithResponse.response?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    
    if (errorWithResponse.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (errorWithResponse.response?.status === 404) {
      return 'The requested resource was not found.';
    }
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle errors with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const errorWithMessage = error as { message: string };
    return errorWithMessage.message;
  }
  
  return 'An unexpected error occurred';
};

export const retryWithAuth = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Check if error has response property and status is 401
      if (error && typeof error === 'object' && 'response' in error) {
        const errorWithResponse = error as { response: { status: number } };
        if (errorWithResponse.response?.status === 401 && attempt < maxRetries) {
          // Attempt to refresh session or redirect to login
          window.location.href = '/auth/signin?returnUrl=' + encodeURIComponent(window.location.pathname);
          return Promise.reject(new UserAuthError('Authentication required', 'AUTH_REQUIRED'));
        }
      }
    }
  }
  
  throw lastError;
};
