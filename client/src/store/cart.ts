/**
 * Cart Store using Zustand
 * Manages shopping cart state and operations
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Cart } from '@/types';
import { apiClient } from '@/services/api';
import { useAppStore } from './app';
import { useAuthStore } from './auth';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  lastFetchTime: number;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<any>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  clearError: () => void;
}

export const useCartStore = create<CartState & CartActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    cart: null,
    isLoading: false,
    error: null,
    isDrawerOpen: false,
    lastFetchTime: 0,

    /**
     * Fetch current cart from API
     */
    fetchCart: async () => {
      try {
        const { user } = useAuthStore.getState();
        if (!user) {
          set({ cart: null });
          return;
        }

        // Prevent rapid successive calls (debounce)
        const now = Date.now();
        const { lastFetchTime } = get();
        if (now - lastFetchTime < 1000) {
          // 1 second debounce
          return;
        }

        set({ isLoading: true, error: null, lastFetchTime: now });

        const cart = await apiClient.getCart();

        set({
          cart,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        // If cart is empty, it's not really an error
        if (error.response?.status === 404 || error.response?.data?.message?.includes('empty')) {
          set({
            cart: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        const errorMessage = error.response?.data?.error || 'Failed to fetch cart';
        set({
          isLoading: false,
          error: errorMessage,
        });

        console.error('Failed to fetch cart:', error);
      }
    },

    /**
     * Add item to cart
     */
    addItem: async (productId: string, quantity: number) => {
      try {
        const { user } = useAuthStore.getState();
        if (!user) {
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to add items to cart.',
          });
          return;
        }

        set({ isLoading: true, error: null });

        const updatedCart = await apiClient.addToCart(productId, quantity);

        set({
          cart: updatedCart,
          isLoading: false,
          error: null,
        });

        // Show success notification
        useAppStore.getState().addNotification({
          type: 'success',
          title: 'Added to Cart',
          message: `Item added to your cart successfully!`,
          duration: 3000,
        });

        // Open cart drawer to show added item
        set({ isDrawerOpen: true });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to add item to cart';

        set({
          isLoading: false,
          error: errorMessage,
        });

        // Show error notification
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Add to Cart Failed',
          message: errorMessage,
        });

        throw error;
      }
    },

    /**
     * Update cart item quantity
     */
    updateItem: async (productId: string, quantity: number) => {
      try {
        set({ isLoading: true, error: null });

        const updatedCart = await apiClient.updateCartItem(productId, quantity);

        set({
          cart: updatedCart,
          isLoading: false,
          error: null,
        });

        // Show success notification
        useAppStore.getState().addNotification({
          type: 'success',
          title: 'Cart Updated',
          message: 'Item quantity updated successfully!',
          duration: 2000,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to update cart item';

        set({
          isLoading: false,
          error: errorMessage,
        });

        // Show error notification
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorMessage,
        });

        throw error;
      }
    },

    /**
     * Remove item from cart
     */
    removeItem: async (productId: string) => {
      try {
        set({ isLoading: true, error: null });

        const updatedCart = await apiClient.removeFromCart(productId);

        set({
          cart: updatedCart,
          isLoading: false,
          error: null,
        });

        // Show success notification
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Item Removed',
          message: 'Item removed from cart successfully!',
          duration: 2000,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to remove item from cart';

        set({
          isLoading: false,
          error: errorMessage,
        });

        // Show error notification
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Remove Failed',
          message: errorMessage,
        });

        throw error;
      }
    },

    /**
     * Clear entire cart
     */
    clearCart: async () => {
      try {
        set({ isLoading: true, error: null });

        await apiClient.clearCart();

        set({
          cart: null,
          isLoading: false,
          error: null,
          isDrawerOpen: false,
        });

        // Show success notification
        useAppStore.getState().addNotification({
          type: 'info',
          title: 'Cart Cleared',
          message: 'All items removed from cart.',
          duration: 2000,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to clear cart';

        set({
          isLoading: false,
          error: errorMessage,
        });

        // Show error notification
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Clear Failed',
          message: errorMessage,
        });

        throw error;
      }
    },

    /**
     * Validate cart items
     */
    validateCart: async () => {
      try {
        const result = await apiClient.validateCart();

        if (!result.isValid) {
          // Show validation issues
          useAppStore.getState().addNotification({
            type: 'warning',
            title: 'Cart Issues Found',
            message: 'Some items in your cart have issues. Please review.',
            duration: 5000,
          });
        }

        return result;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to validate cart';

        useAppStore.getState().addNotification({
          type: 'error',
          title: 'Validation Failed',
          message: errorMessage,
        });

        throw error;
      }
    },

    /**
     * Open cart drawer
     */
    openDrawer: () => {
      set({ isDrawerOpen: true });
    },

    /**
     * Close cart drawer
     */
    closeDrawer: () => {
      set({ isDrawerOpen: false });
    },

    /**
     * Toggle cart drawer
     */
    toggleDrawer: () => {
      set((state) => ({ isDrawerOpen: !state.isDrawerOpen }));
    },

    /**
     * Clear cart errors
     */
    clearError: () => {
      set({ error: null });
    },
  }))
);
