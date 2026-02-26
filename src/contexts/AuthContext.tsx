import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type LoginRequest, type RegisterRequest } from '@/services/authService';

export interface User {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  name: string; // kept for backward compat — equals first_name + ' ' + last_name
  role: 'mother' | 'chw' | 'nurse';
}

interface AuthContextType {
  user: User | null;
  isFirstLogin: boolean;
  login: (phone: string, pin: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; userId?: number; error?: string }>;
  verifyOTP: (phone: string, otpCode: string, extras?: { license_number?: string; ward_id?: number; dob?: string; due_date?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  markOnboardingComplete: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Restore session on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      const typedUser = currentUser as User;
      setUser(typedUser);
      setIsAuthenticated(true);
      // Restore first-login flag for ALL roles
      setIsFirstLogin(authService.isFirstLogin(typedUser.id));
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, pin: string): Promise<{ success: boolean; role?: string; error?: string }> => {
    console.log('🚪 AuthContext login called');

    try {
      const response = await authService.login({
        phone_number: phone,
        pin: pin,
      });

      console.log('✅ AuthService login successful, response:', response);

      const typedUser = response.user as User;
      setUser(typedUser);
      setIsAuthenticated(true);

      // Set first-login flag for ALL roles (each role has its own onboarding)
      setIsFirstLogin(authService.isFirstLogin(typedUser.id));

      console.log('💾 User state updated successfully');
      return { success: true, role: response.user.role };
    } catch (error: any) {
      console.error('❌ AuthContext login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; userId?: number; error?: string }> => {
    try {
      const response = await authService.register(userData);
      return {
        success: true,
        userId: response.user_id,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const verifyOTP = async (
    phone: string,
    otpCode: string,
    extras?: { license_number?: string; ward_id?: number; dob?: string; due_date?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.verifyOTP({
        phone_number: phone,
        otp_code: otpCode,
        ...extras,
      });
      // Store the role-specific profile ID so components can use it
      // e.g. OnboardingModal needs mothers.id (not users.id) for next-of-kin
      if (response.profile_id && response.role === 'mother') {
        localStorage.setItem('mother_profile_id', String(response.profile_id));
      }
      return { success: true };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.message || 'OTP verification failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const markOnboardingComplete = () => {
    if (user) {
      authService.markOnboardingComplete(user.id);
      setIsFirstLogin(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsFirstLogin(false);
    // Always send user back to the main app entry
    window.location.href = "http://localhost:8080";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isFirstLogin,
        login,
        register,
        verifyOTP,
        logout,
        markOnboardingComplete,
        isAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}