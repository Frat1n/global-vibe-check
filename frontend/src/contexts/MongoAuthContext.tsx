/**
 * MongoDB Authentication Context
 * 
 * This context provides authentication functionality using our MongoDB backend
 * instead of Supabase. Handles user registration, login, email verification,
 * and session management with JWT tokens.
 * 
 * Features:
 * - User registration with email verification
 * - JWT-based authentication
 * - Automatic token refresh
 * - Local storage session persistence
 * - Clean error handling
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// User interface
interface User {
  id: string;
  email: string;
  display_name?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const MongoAuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(MongoAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a MongoAuthProvider');
  }
  return context;
};

// Auth provider component
export const MongoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get backend URL from environment
  const getBackendUrl = () => {
    return import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  };

  // Get stored token
  const getStoredToken = () => {
    return localStorage.getItem('auth_token');
  };

  // Store token
  const storeToken = (token: string) => {
    localStorage.setItem('auth_token', token);
  };

  // Remove stored token
  const removeToken = () => {
    localStorage.removeItem('auth_token');
  };

  /**
   * Fetch current user information
   */
  const fetchCurrentUser = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else {
        // Token is invalid
        removeToken();
        return null;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  /**
   * Sign up new user
   */
  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${getBackendUrl()}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful! 🎉",
          description: result.message || "Please check your email for verification (check console for demo)",
        });
      } else {
        throw new Error(result.detail || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in user
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store token and user data
        storeToken(result.access_token);
        setUser(result.user);

        toast({
          title: "Welcome back! 👋",
          description: `Signed in as ${result.user.email}`,
        });
      } else {
        throw new Error(result.detail || 'Login failed');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out user
   */
  const signOut = () => {
    removeToken();
    setUser(null);
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    const token = getStoredToken();
    if (token) {
      const userData = await fetchCurrentUser(token);
      setUser(userData);
    }
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = getStoredToken();
        
        if (token) {
          const userData = await fetchCurrentUser(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <MongoAuthContext.Provider value={value}>
      {children}
    </MongoAuthContext.Provider>
  );
};