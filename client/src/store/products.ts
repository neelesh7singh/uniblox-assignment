/**
 * Product Store - Zustand store for product catalog management
 * Handles product listing, filtering, searching, and caching
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from 'sonner';

import { apiClient } from '@/services/api';
import type { Product, PaginatedResponse, ProductFilter, ApiError } from '@/types';

interface ProductsState {
  // Product data
  products: Product[];
  categories: string[];
  currentProduct: Product | null;

  // Pagination and filtering
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: ProductFilter;

  // UI state
  loading: {
    products: boolean;
    categories: boolean;
    currentProduct: boolean;
    suggestions: boolean;
  };

  error: string | null;

  // Search and suggestions
  searchSuggestions: Partial<Product>[];
  searchHistory: string[];

  // Actions
  fetchProducts: (
    filters?: ProductFilter & { page?: number; limit?: number },
    append?: boolean
  ) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSuggestions: (query: string) => Promise<void>;

  // Filter and search actions
  setFilters: (filters: Partial<ProductFilter>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSearchTerm: (search: string) => void;
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;

  // Utility actions
  clearError: () => void;
  clearCurrentProduct: () => void;
  reset: () => void;
}

const initialFilters: ProductFilter = {
  search: '',
  category: '',
  minPrice: undefined,
  maxPrice: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const initialState = {
  products: [],
  categories: [],
  currentProduct: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: initialFilters,
  loading: {
    products: false,
    categories: false,
    currentProduct: false,
    suggestions: false,
  },
  error: null,
  searchSuggestions: [],
  searchHistory: JSON.parse(localStorage.getItem('product_search_history') || '[]'),
};

export const useProductsStore = create<ProductsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Fetch products with filters and pagination
      fetchProducts: async (
        filters?: ProductFilter & { page?: number; limit?: number },
        append = false
      ) => {
        const state = get();

        try {
          set((state) => ({
            ...state,
            loading: { ...state.loading, products: true },
            error: null,
          }));

          const queryFilters = {
            ...state.filters,
            ...filters,
            page: filters?.page || state.pagination.page,
            limit: filters?.limit || state.pagination.limit,
          };

          const response = await apiClient.getProducts(queryFilters);

          set((state) => ({
            ...state,
            products: append ? [...state.products, ...(response.data || [])] : response.data || [],
            pagination: response.pagination,
            filters: {
              ...state.filters,
              ...filters,
            },
            loading: { ...state.loading, products: false },
            error: null,
          }));
        } catch (error) {
          const errorMessage =
            (error as ApiError)?.response?.data?.error || 'Failed to fetch products';

          set((state) => ({
            ...state,
            loading: { ...state.loading, products: false },
            error: errorMessage,
          }));

          toast.error('Products Error', {
            description: errorMessage,
          });
        }
      },

      // Fetch single product by ID
      fetchProductById: async (id: string) => {
        try {
          set((state) => ({
            ...state,
            loading: { ...state.loading, currentProduct: true },
            error: null,
          }));

          const product = await apiClient.getProduct(id);

          set((state) => ({
            ...state,
            currentProduct: product,
            loading: { ...state.loading, currentProduct: false },
            error: null,
          }));
        } catch (error) {
          const errorMessage = (error as ApiError)?.response?.data?.error || 'Product not found';

          set((state) => ({
            ...state,
            currentProduct: null,
            loading: { ...state.loading, currentProduct: false },
            error: errorMessage,
          }));

          toast.error('Product Error', {
            description: errorMessage,
          });
        }
      },

      // Fetch product categories
      fetchCategories: async () => {
        try {
          set((state) => ({
            ...state,
            loading: { ...state.loading, categories: true },
            error: null,
          }));

          const categories = await apiClient.getProductCategories();

          set((state) => ({
            ...state,
            categories,
            loading: { ...state.loading, categories: false },
            error: null,
          }));
        } catch (error) {
          const errorMessage =
            (error as ApiError)?.response?.data?.error || 'Failed to fetch categories';

          set((state) => ({
            ...state,
            loading: { ...state.loading, categories: false },
            error: errorMessage,
          }));

          console.error('Failed to fetch categories:', error);
        }
      },

      // Fetch search suggestions
      fetchSuggestions: async (query: string) => {
        if (!query.trim()) {
          set((state) => ({
            ...state,
            searchSuggestions: [],
          }));
          return;
        }

        try {
          set((state) => ({
            ...state,
            loading: { ...state.loading, suggestions: true },
          }));

          const suggestions = await apiClient.getProductSuggestions(query, 5);

          set((state) => ({
            ...state,
            searchSuggestions: suggestions,
            loading: { ...state.loading, suggestions: false },
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            searchSuggestions: [],
            loading: { ...state.loading, suggestions: false },
          }));

          console.error('Failed to fetch suggestions:', error);
        }
      },

      // Set filters
      setFilters: (newFilters: Partial<ProductFilter>) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 }, // Reset to first page
        }));

        // Auto-fetch products with new filters
        get().fetchProducts();
      },

      // Clear all filters
      clearFilters: () => {
        set((state) => ({
          ...state,
          filters: initialFilters,
          pagination: { ...state.pagination, page: 1 },
        }));

        get().fetchProducts();
      },

      // Set page number
      setPage: (page: number) => {
        set((state) => ({
          ...state,
          pagination: { ...state.pagination, page },
        }));

        get().fetchProducts({ page });
      },

      // Set search term
      setSearchTerm: (search: string) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, search },
          pagination: { ...state.pagination, page: 1 },
        }));

        if (search.trim()) {
          get().addToSearchHistory(search.trim());
        }

        get().fetchProducts();
      },

      // Add search term to history
      addToSearchHistory: (term: string) => {
        const state = get();
        const history = state.searchHistory;

        if (history.includes(term)) return;

        const newHistory = [term, ...history.slice(0, 9)]; // Keep last 10 searches

        localStorage.setItem('product_search_history', JSON.stringify(newHistory));

        set((state) => ({
          ...state,
          searchHistory: newHistory,
        }));
      },

      // Clear search history
      clearSearchHistory: () => {
        localStorage.removeItem('product_search_history');

        set((state) => ({
          ...state,
          searchHistory: [],
        }));
      },

      // Utility actions
      clearError: () => {
        set((state) => ({
          ...state,
          error: null,
        }));
      },

      clearCurrentProduct: () => {
        set((state) => ({
          ...state,
          currentProduct: null,
        }));
      },

      reset: () => {
        set({
          ...initialState,
          searchHistory: JSON.parse(localStorage.getItem('product_search_history') || '[]'),
        });
      },
    }),
    {
      name: 'products-store',
    }
  )
);
