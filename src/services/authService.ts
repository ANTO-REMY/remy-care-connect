/**
 * Authentication Service
 * Handles user registration, login, OTP verification
 */

import { apiClient } from '@/lib/apiClient';

export interface RegisterRequest {
  phone_number: string;
  name: string;
  pin: string;
  role: 'mother' | 'chw' | 'nurse';
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  phone_number: string;
  verification_sent: boolean;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
}

export interface VerifyOTPResponse {
  message: string;
  user: {
    id: number;
    phone_number: string;
    name: string;
    role: string;
    is_active: boolean;
  };
}

export interface LoginRequest {
  phone_number: string;
  pin: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    phone_number: string;
    name: string;
    role: string;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    return apiClient.post<VerifyOTPResponse>('/auth/verify-otp', data);
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Attempting login with:', { phone: data.phone_number, pin: '***' });
    
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      console.log('✅ Login response received:', { 
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        userRole: response.user?.role 
      });
      
      // Save tokens to localStorage
      if (response.access_token && response.refresh_token) {
        apiClient.saveTokens(response.access_token, response.refresh_token);
        // Save user data
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('💾 Tokens and user data saved to localStorage');
      } else {
        console.warn('⚠️ Missing tokens in response:', response);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    apiClient.clearTokens();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): LoginResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem('access_token');
    const user = this.getCurrentUser();
    return !!(accessToken && user);
  }
}

export const authService = new AuthService();
