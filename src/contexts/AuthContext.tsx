/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type CHWFacilityLinkState, type LoginRequest, type RegisterRequest } from '@/services/authService';
import { initFirebaseMessaging, unregisterDeviceToken } from '@/lib/firebaseClient';
import { disconnectSocket } from '@/lib/socketClient';

export interface User {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  name: string; // kept for backward compat — equals first_name + ' ' + last_name
  role: 'mother' | 'chw' | 'nurse' | 'facility_staff';
  profile_id?: number; // ID of the Mother, CHW, or Nurse profile record
  facility_id?: number;
  account_role?: string;
  profile_completed?: boolean;
  chw_facility_link?: CHWFacilityLinkState | null;
}

interface AuthContextType {
  user: User | null;
  isFirstLogin: boolean;
  login: (phone: string, pin: string, otpCode?: string) => Promise<{ success: boolean; role?: string; error?: string; requiresOtp?: boolean; message?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; userId?: number; error?: string }>;
  verifyOTP: (phone: string, otpCode: string, extras?: { license_number?: string; ward_id?: number; linked_facility_id?: number; new_facility_name?: string; new_facility_ward_id?: number; dob?: string; due_date?: string }) => Promise<{ success: boolean; error?: string }>;
  hydrateAuthSession: (nextUser: User) => void;
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

  const syncRoleProfileSession = (nextUser: User) => {
    sessionStorage.removeItem('mother_profile_id');
    sessionStorage.removeItem('chw_profile_id');
    sessionStorage.removeItem('nurse_profile_id');

    if (!nextUser.profile_id) return;

    if (nextUser.role === 'mother') {
      sessionStorage.setItem('mother_profile_id', String(nextUser.profile_id));
    } else if (nextUser.role === 'chw') {
      sessionStorage.setItem('chw_profile_id', String(nextUser.profile_id));
    } else if (nextUser.role === 'nurse') {
      sessionStorage.setItem('nurse_profile_id', String(nextUser.profile_id));
    }
  };

  const hydrateAuthSession = (nextUser: User) => {
    sessionStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
    setIsFirstLogin(authService.isFirstLogin(nextUser.id));
    syncRoleProfileSession(nextUser);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      // Quick restore from localStorage so the UI doesn't flash /login
      const cachedUser = authService.getCurrentUser();
      if (cachedUser && authService.isAuthenticated()) {
        const typedUser = cachedUser as User;
        if (!cancelled) {
          hydrateAuthSession(typedUser);
        }

        // Validate against the server — the JWT determines the real role/user.
        // If they differ (e.g. another login in the same browser overwrote
        // localStorage), update both localStorage and React state.
        if (typedUser.role !== 'facility_staff') {
          try {
            const serverUser = await authService.getServerProfile();
            if (!cancelled) {
              const fresh: User = {
                ...typedUser,
                id: serverUser.id,
                phone_number: serverUser.phone_number,
                first_name: serverUser.first_name,
                last_name: serverUser.last_name,
                name: serverUser.name,
                role: serverUser.role as User['role'],
                profile_id: serverUser.profile_id,
              };
              hydrateAuthSession(fresh);
            }
          } catch {
            // Server unreachable or token expired — keep cached user for now;
            // the first API call will trigger a token refresh / redirect anyway.
          }
        }
      }
      if (!cancelled) setLoading(false);
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = async (phone: string, pin: string, otpCode?: string): Promise<{ success: boolean; role?: string; error?: string; requiresOtp?: boolean; message?: string }> => {
    console.log('🚪 AuthContext login called');

    try {
      const response = await authService.login({
        phone_number: phone,
        pin: pin,
        otp_code: otpCode,
      });

      console.log('✅ AuthService login successful, response:', response);

      if (response.requires_otp) {
        return {
          success: false,
          requiresOtp: true,
          message: response.message || 'OTP required to complete login.',
        };
      }

      if (!response.user || !response.access_token || !response.refresh_token) {
        return {
          success: false,
          error: 'Login response is incomplete. Please try again.',
        };
      }

      const typedUser = response.user as User;
      hydrateAuthSession(typedUser);

      // Best-effort: initialise FCM and register this device token after login.
      // If the user denies permission, the rest of login still succeeds.
      try {
        await initFirebaseMessaging();
      } catch (e) {
        console.warn('[FCM] initFirebaseMessaging failed:', e);
      }

      console.log('💾 User state updated successfully');
      return { success: true, role: response.user.role };
    } catch (error: unknown) {
      console.error('❌ AuthContext login error:', error);
      const errorMessage = (error as Error).message || 'Login failed. Please try again.';
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
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = (error as Error).message || 'Registration failed. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const verifyOTP = async (
    phone: string,
    otpCode: string,
    extras?: { license_number?: string; ward_id?: number; linked_facility_id?: number; new_facility_name?: string; new_facility_ward_id?: number; dob?: string; due_date?: string }
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
        sessionStorage.setItem('mother_profile_id', String(response.profile_id));
      }
      return { success: true };
    } catch (error: unknown) {
      console.error('OTP verification error:', error);
      const errorMessage = (error as Error).message || 'OTP verification failed. Please try again.';
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
    // Close websocket immediately so logout does not trigger reconnect noise.
    disconnectSocket();

    const fcmToken = sessionStorage.getItem('fcm_token');

    (async () => {
      if (!fcmToken) return;

      // Don't let logout hang indefinitely on network.
      await Promise.race([
        unregisterDeviceToken(fcmToken),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    })().finally(() => {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setIsFirstLogin(false);
      sessionStorage.removeItem('mother_profile_id');
      sessionStorage.removeItem('chw_profile_id');
      sessionStorage.removeItem('nurse_profile_id');
      // Always send user back to the main app entry
      window.location.href = "/";
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isFirstLogin,
        login,
        register,
        verifyOTP,
        hydrateAuthSession,
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
