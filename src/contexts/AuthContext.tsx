import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type LoginRequest, type RegisterRequest } from '@/services/authService';

interface User {
  id: number;
  name: string;
  phone_number: string;
  role: 'mother' | 'chw' | 'nurse';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; userId?: number; error?: string }>;
  verifyOTP: (phone: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.login({
        phone_number: phone,
        pin: pin,
      });

      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Use the user-friendly message from the API client
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
      
      // Use the user-friendly message from the API client
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const verifyOTP = async (phone: string, otpCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.verifyOTP({
        phone_number: phone,
        otp_code: otpCode,
      });

      // OTP verified successfully, but user still needs to login
      return { success: true };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Use the user-friendly message from the API client
      const errorMessage = error.message || 'OTP verification failed. Please try again.';
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, isAuthenticated, loading }}>
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