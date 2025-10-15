import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  nextOfKin: any;
  id: string;
  name: string;
  phone: string;
  role: 'mother' | 'chw' | 'nurse';
  location?: string;
  dueDate?: string;
  weeksPregnant?: number;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string, role: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('remyafya_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (phone: string, password: string, role: string): Promise<boolean> => {
    // Simple validation - in real app this would call an API
    const users = JSON.parse(localStorage.getItem('remyafya_users') || '[]');
    const foundUser = users.find((u: any) => 
      u.phone === phone && u.password === password && u.role === role
    );

    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('remyafya_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      // Get existing users or create empty array
      const users = JSON.parse(localStorage.getItem('remyafya_users') || '[]');
      
      // Check if user already exists
      const existingUser = users.find((u: any) => u.phone === userData.phone);
      if (existingUser) {
        return false; // User already exists
      }

      // Create new user with ID
      const newUser = {
        ...userData,
        id: Date.now().toString()
      };

      // Save to users array
      users.push(newUser);
      localStorage.setItem('remyafya_users', JSON.stringify(users));

      // Auto-login the user
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('remyafya_user', JSON.stringify(userWithoutPassword));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('remyafya_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>
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