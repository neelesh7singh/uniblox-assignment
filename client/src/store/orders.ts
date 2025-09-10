/**
 * Order Management Store
 * Handles order history, tracking, and management functionality
 */

import { create } from 'zustand';
import type { Order, OrderStatus, ApiError } from '@/types';
import { apiClient } from '@/services/api';

interface OrdersState {
  // Data
  orders: Order[];
  currentOrder: Order | null;
  orderStats: {
    totalOrders: number;
    totalSpent: number;
    ordersUntilDiscount: number;
  } | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Loading states
  loading: {
    orders: boolean;
    order: boolean;
    stats: boolean;
  };

  // Error handling
  error: string | null;

  // Actions
  fetchOrders: (page?: number, limit?: number) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  fetchOrderStats: () => Promise<void>;
  clearCurrentOrder: () => void;
  clearError: () => void;
}

const initialState = {
  orders: [],
  currentOrder: null,
  orderStats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  loading: {
    orders: false,
    order: false,
    stats: false,
  },
  error: null,
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  ...initialState,

  // Fetch user's order history with pagination
  fetchOrders: async (page = 1, limit = 10) => {
    set((state) => ({
      loading: { ...state.loading, orders: true },
      error: null,
    }));

    try {
      const response = await apiClient.getOrders(page, limit);

      set((state) => ({
        orders: response.data || [],
        pagination: response.pagination,
        loading: { ...state.loading, orders: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to fetch orders';

      set((state) => ({
        loading: { ...state.loading, orders: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch orders:', error);
    }
  },

  // Fetch specific order by ID
  fetchOrderById: async (id: string) => {
    set((state) => ({
      loading: { ...state.loading, order: true },
      error: null,
    }));

    try {
      const order = await apiClient.getOrder(id);

      set((state) => ({
        currentOrder: order,
        loading: { ...state.loading, order: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to fetch order';

      set((state) => ({
        loading: { ...state.loading, order: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch order:', error);
    }
  },

  // Fetch user's order statistics
  fetchOrderStats: async () => {
    set((state) => ({
      loading: { ...state.loading, stats: true },
      error: null,
    }));

    try {
      const stats = await apiClient.getOrderStats();

      set((state) => ({
        orderStats: stats,
        loading: { ...state.loading, stats: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        (error as ApiError)?.response?.data?.error || 'Failed to fetch order stats';

      set((state) => ({
        loading: { ...state.loading, stats: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch order stats:', error);
    }
  },

  // Clear current order from state
  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
