/**
 * Admin Management Store
 * Handles admin dashboard data and operations
 */

import { create } from 'zustand';
import type {
  User,
  Product,
  Order,
  ApiError,
  PurchaseAnalytics,
  PurchaseAnalyticsSummary,
} from '@/types';
import { apiClient } from '@/services/api';

interface AdminState {
  // Analytics Data
  purchaseAnalytics: PurchaseAnalyticsSummary | null;

  // Management Data
  users: User[];
  products: Product[];
  orders: Order[];

  // Pagination
  pagination: {
    users: { page: number; limit: number; total: number; pages: number };
    products: { page: number; limit: number; total: number; pages: number };
    orders: { page: number; limit: number; total: number; pages: number };
  };

  // Loading states
  loading: {
    analytics: boolean;
    users: boolean;
    products: boolean;
    orders: boolean;
  };

  // Error handling
  error: string | null;

  // Actions
  fetchAnalytics: () => Promise<void>;
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchProducts: (page?: number, limit?: number) => Promise<void>;
  fetchOrders: (page?: number, limit?: number) => Promise<void>;

  // Order management
  updateOrderStatus: (id: string, status: string) => Promise<void>;

  // Product management
  createProduct: (productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    stock: number;
  }) => Promise<void>;

  // Utility actions
  clearError: () => void;
  refreshData: () => Promise<void>;
}

const initialState = {
  purchaseAnalytics: null,
  users: [],
  products: [],
  orders: [],
  pagination: {
    users: { page: 1, limit: 10, total: 0, pages: 0 },
    products: { page: 1, limit: 10, total: 0, pages: 0 },
    orders: { page: 1, limit: 10, total: 0, pages: 0 },
  },
  loading: {
    analytics: false,
    users: false,
    products: false,
    orders: false,
  },
  error: null,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  ...initialState,

  // Fetch all analytics data
  fetchAnalytics: async () => {
    set((state) => ({
      loading: { ...state.loading, analytics: true },
      error: null,
    }));

    try {
      const [purchaseResponse] = await Promise.all([apiClient.getPurchaseAnalytics()]);

      // Extract summary data from purchase analytics response
      const purchaseAnalytics = purchaseResponse.summary
        ? {
            totalPurchases: purchaseResponse.summary.totalQuantitySold || 0,
            totalRevenue: purchaseResponse.summary.totalRevenue || 0,
            averageOrderValue: 0, // Calculate from purchase data if needed
            topSellingProducts:
              purchaseResponse.data?.slice(0, 5).map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantitySold: item.totalQuantity,
                revenue: item.totalRevenue,
              })) || [],
            purchasesByStatus: {},
            revenueByMonth: [],
          }
        : null;

      set((state) => ({
        purchaseAnalytics,
        loading: { ...state.loading, analytics: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        (error as ApiError)?.response?.data?.error || 'Failed to fetch analytics';

      set((state) => ({
        loading: { ...state.loading, analytics: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch analytics:', error);
    }
  },

  // Fetch users with pagination
  fetchUsers: async (page = 1, limit = 10) => {
    set((state) => ({
      loading: { ...state.loading, users: true },
      error: null,
    }));

    try {
      const response = await apiClient.getUsers({ page, limit });

      set((state) => ({
        users: response.data || [],
        pagination: {
          ...state.pagination,
          users: response.pagination,
        },
        loading: { ...state.loading, users: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to fetch users';

      set((state) => ({
        loading: { ...state.loading, users: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch users:', error);
    }
  },

  // Fetch products with pagination
  fetchProducts: async (page = 1, limit = 10) => {
    set((state) => ({
      loading: { ...state.loading, products: true },
      error: null,
    }));

    try {
      const response = await apiClient.getAdminProducts({ page, limit });

      set((state) => ({
        products: response.data || [],
        pagination: {
          ...state.pagination,
          products: response.pagination,
        },
        loading: { ...state.loading, products: false },
        error: null,
      }));
    } catch (error) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to fetch products';

      set((state) => ({
        loading: { ...state.loading, products: false },
        error: errorMessage,
      }));

      console.error('Failed to fetch products:', error);
    }
  },

  // Fetch orders with pagination
  fetchOrders: async (page = 1, limit = 10) => {
    set((state) => ({
      loading: { ...state.loading, orders: true },
      error: null,
    }));

    try {
      const response = await apiClient.getAdminOrders({ page, limit });

      set((state) => ({
        orders: response.data || [],
        pagination: {
          ...state.pagination,
          orders: response.pagination,
        },
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

  // Update order status
  updateOrderStatus: async (id, status) => {
    try {
      const updatedOrder = await apiClient.updateOrderStatus(id, status);

      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        (error as ApiError)?.response?.data?.error || 'Failed to update order status';
      set({ error: errorMessage });
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const newProduct = await apiClient.createProduct(productData);

      set((state) => ({
        products: [newProduct, ...state.products],
        error: null,
      }));
    } catch (error) {
      const errorMessage = (error as ApiError)?.response?.data?.error || 'Failed to create product';
      set({ error: errorMessage });
      throw error;
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Refresh all data
  refreshData: async () => {
    const { fetchAnalytics, fetchUsers, fetchProducts, fetchOrders } = get();

    await Promise.all([fetchAnalytics(), fetchUsers(), fetchProducts(), fetchOrders()]);
  },
}));
