/**
 * Authentication Store using Zustand
 * Manages user authentication state and operations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthStore, RegisterRequest } from '@/types';
import { apiClient } from '@/services/api';
import { useAppStore } from './app';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      error: null,

      /**
       * Login user with email and password
       */
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.login({ email, password });

          // Store token in localStorage for API client
          localStorage.setItem('auth_token', response.token);

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          });

          // Fetch user's cart after successful login
          const { useCartStore } = await import('./cart');
          useCartStore.getState().fetchCart();

          // Add success notification
          useAppStore.getState().addNotification({
            type: 'success',
            title: 'Login Successful',
            message: `Welcome back, ${response.user.firstName}!`,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // Add error notification
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Login Failed',
            message: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.register(data);

          // Store token in localStorage for API client
          localStorage.setItem('auth_token', response.token);

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          });

          // Fetch user's cart after successful registration
          const { useCartStore } = await import('./cart');
          useCartStore.getState().fetchCart();

          // Add success notification
          useAppStore.getState().addNotification({
            type: 'success',
            title: 'Registration Successful',
            message: `Welcome to Uniblox, ${response.user.firstName}!`,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // Add error notification
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Registration Failed',
            message: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Logout user and clear all data
       */
      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem('auth_token');

        // Reset auth state
        set({
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });

        // Clear cart when user logs out
        const { useCartStore } = require('./cart');
        useCartStore.getState().setState({ cart: null, isDrawerOpen: false, lastFetchTime: 0 });

        // Add notification
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Logged Out',
          message: 'You have been logged out successfully.',
        });

        // Redirect to login (will be handled by the component)
        window.location.href = '/auth/login';
      },

      /**
       * Update user profile
       */
      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });

          const updatedUser = await apiClient.updateProfile(data);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });

          // Add success notification
          useAppStore.getState().addNotification({
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully.',
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Profile update failed';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // Add error notification
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Update Failed',
            message: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Refresh authentication token
       */
      refreshToken: async () => {
        try {
          const { token } = get();
          if (!token) return;

          const response = await apiClient.refreshToken();

          // Update token in localStorage
          localStorage.setItem('auth_token', response.token);

          set({
            token: response.token,
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
        }
      },

      /**
       * Clear any authentication errors
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Check authentication status on app load
       */
      checkAuthStatus: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            set({ user: null, token: null });
            return;
          }

          // Verify token with backend
          const user = await apiClient.getProfile();

          set({
            user,
            token,
            error: null,
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            error: null,
          });
        }
      },
    }),
    {
      name: 'uniblox-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading states or errors
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
