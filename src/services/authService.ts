/**
 * Authentication Service
 * Handles user registration, login, OTP verification
 */

import { apiClient } from '@/lib/apiClient';

export interface RegisterRequest {
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  pin: string;
  role: 'mother' | 'chw' | 'nurse';
  license_number?: string;  // for CHW/Nurse
  ward_id?: number;         // for all roles (location derived from ward)
  dob?: string;             // for Mother
  due_date?: string;        // for Mother
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  role: string;
  first_name: string;
  last_name: string;
  otp_code: string;      // dev only — remove check in production
  expires_in: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
  license_number?: string; // forwarded for CHW/Nurse profile creation
  ward_id?: number;        // forwarded for all roles (location derived from ward)
  dob?: string;            // forwarded for Mother profile creation
  due_date?: string;       // forwarded for Mother profile creation
}

export interface VerifyOTPResponse {
  message: string;
  user_id: number;
  role: string;
  profile_id: number | null;
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
    first_name: string;
    last_name: string;
    email?: string;
    name: string;
    role: string;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
}

const FIRST_LOGIN_KEY = 'remy_first_login';

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

      // Save tokens to sessionStorage (per-tab isolation)
      if (response.access_token && response.refresh_token) {
        apiClient.saveTokens(response.access_token, response.refresh_token);
        // Save user data to sessionStorage
        sessionStorage.setItem('user', JSON.stringify(response.user));

        // Track first login for ALL roles so the onboarding modal fires on first login
        const alreadySeen = localStorage.getItem(`${FIRST_LOGIN_KEY}_${response.user.id}`);
        if (!alreadySeen) {
          localStorage.setItem(`${FIRST_LOGIN_KEY}_${response.user.id}`, 'pending');
        }

        console.log('💾 Tokens and user data saved to sessionStorage');
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
   * Mark onboarding as complete for this user
   */
  markOnboardingComplete(userId: number): void {
    localStorage.setItem(`${FIRST_LOGIN_KEY}_${userId}`, 'complete');
  }

  /**
   * Check if this is the user's first login (onboarding pending)
   */
  isFirstLogin(userId: number): boolean {
    return localStorage.getItem(`${FIRST_LOGIN_KEY}_${userId}`) === 'pending';
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
   * Get current user from sessionStorage
   */
  getCurrentUser(): LoginResponse['user'] | null {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Fetch the authenticated user's profile from the server.
   * Returns the canonical user data (id, role, name, etc.) as the
   * backend sees it — useful for validating a cached localStorage session.
   */
  async getServerProfile(): Promise<LoginResponse['user']> {
    const data = await apiClient.get<{
      id: number;
      phone_number: string;
      name: string;
      role: string;
      is_verified: boolean;
    }>('/auth/profile');

    // The /auth/profile endpoint returns name as a single field.
    // Split it into first/last to match the LoginResponse shape.
    const parts = (data.name ?? '').split(' ');
    const first_name = parts[0] ?? '';
    const last_name = parts.slice(1).join(' ');

    return {
      id: data.id,
      phone_number: data.phone_number,
      name: data.name,
      first_name,
      last_name,
      role: data.role,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = sessionStorage.getItem('access_token');
    const user = this.getCurrentUser();
    return !!(accessToken && user);
  }
}

export const authService = new AuthService();
