/**
 * API Client for RemyCareConnect Backend
 * Handles all HTTP requests with JWT token authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get access token from sessionStorage (per-tab isolation)
   */
  private getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  /**
   * Get refresh token from sessionStorage
   */
  private getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  /**
   * Save tokens to sessionStorage (per-tab)
   */
  saveTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Clear tokens from sessionStorage
   */
  clearTokens(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          sessionStorage.setItem('access_token', data.access_token);
          return data.access_token;
        }
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Make HTTP request with automatic token refresh on 401
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = this.getAccessToken();

    // Add default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - Try to refresh token
      if (response.status === 401 && accessToken) {
        const newAccessToken = await this.refreshAccessToken();

        if (newAccessToken) {
          // Retry request with new token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed - clear tokens and redirect to login
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Create user-friendly error messages
        let userMessage = '';

        switch (response.status) {
          case 400:
            userMessage = errorData.error || errorData.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            userMessage = 'Invalid credentials. Please check your phone number and PIN.';
            break;
          case 403:
            userMessage = 'Access denied. You don\'t have permission for this action.';
            break;
          case 404:
            userMessage = 'Resource not found. The requested item may have been removed.';
            break;
          case 409:
            userMessage = errorData.error || 'This information already exists. Please use different details.';
            break;
          case 422:
            userMessage = errorData.error || 'Invalid data provided. Please check all required fields.';
            break;
          case 429:
            userMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            userMessage = 'Server error occurred. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            userMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            break;
          default:
            userMessage = errorData.error || errorData.message || `An error occurred (${response.status}). Please try again.`;
        }

        const error: ApiError = {
          message: userMessage,
          status: response.status,
        };
        throw error;
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Re-throw ApiError
      if ((error as ApiError).status) {
        throw error;
      }

      // Network or other errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      let userFriendlyMessage = '';
      if (errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again.';
      } else {
        userFriendlyMessage = 'Network error occurred. Please check your connection and try again.';
      }

      throw {
        message: userFriendlyMessage,
        status: 0,
      } as ApiError;
    }
  }

  /**
   * HTTP GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * HTTP POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { ApiError };
