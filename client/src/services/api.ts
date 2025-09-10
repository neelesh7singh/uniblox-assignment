/**
 * API Client for Uniblox E-commerce Backend
 * Handles all HTTP requests with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Product,
  Cart,
  Order,
  Coupon,
  CheckoutRequest,
  CheckoutResponse,
  PaginatedResponse,
  ProductFilter,
  PurchaseAnalytics,
  AdminStats,
  User,
} from '@/types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Main API client class
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): void {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }

    // Log error for debugging (in development)
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  }

  // Authentication API methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return response.data.data!;
  }

  async getProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/auth/profile');
    return response.data.data;
  }

  async updateProfile(userData: Partial<any>): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/auth/profile', userData);
    return response.data.data;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.client.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data.data!;
  }

  // Product API methods
  async getProducts(
    filters?: ProductFilter & { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `/products?${params}`;
    const response = await this.client.get<PaginatedResponse<Product>>(url);
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  }

  async getProductCategories(): Promise<string[]> {
    const response = await this.client.get<ApiResponse<string[]>>('/products/meta/categories');
    return response.data.data!;
  }

  async getProductSuggestions(query: string, limit = 5): Promise<Partial<Product>[]> {
    const response = await this.client.get<ApiResponse<Partial<Product>[]>>(
      `/products/search/suggestions?q=${query}&limit=${limit}`
    );
    return response.data.data!;
  }

  // Cart API methods
  async getCart(): Promise<Cart> {
    const response = await this.client.get<ApiResponse<Cart>>('/cart');
    return response.data.data!;
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const response = await this.client.post<ApiResponse<Cart>>('/cart/add', {
      productId,
      quantity,
    });
    return response.data.data!;
  }

  async updateCartItem(productId: string, quantity: number): Promise<Cart> {
    const response = await this.client.put<ApiResponse<Cart>>(`/cart/${productId}`, {
      quantity,
    });
    return response.data.data!;
  }

  async removeFromCart(productId: string): Promise<Cart> {
    const response = await this.client.delete<ApiResponse<Cart>>(`/cart/${productId}`);
    return response.data.data!;
  }

  async clearCart(): Promise<void> {
    await this.client.delete('/cart');
  }

  async validateCart(): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/cart/validate');
    return response.data.data;
  }

  // Order API methods
  async checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await this.client.post<ApiResponse<CheckoutResponse>>(
      '/orders/checkout',
      data
    );
    return response.data.data!;
  }

  async getOrders(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);

    const response = await this.client.get<PaginatedResponse<Order>>(`/orders/history?${params}`);
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.client.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data!;
  }

  async getOrderStats(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/orders/stats/summary');
    return response.data.data;
  }

  async cancelOrder(id: string): Promise<Order> {
    const response = await this.client.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data.data!;
  }

  // Coupon API methods
  async validateCoupon(couponCode: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/coupons/validate', {
      couponCode,
    });
    return response.data.data;
  }

  // Admin API methods
  async getPurchaseAnalytics(
    page = 1,
    limit = 20,
    sortBy = 'totalRevenue',
    sortOrder = 'desc'
  ): Promise<{
    data: PurchaseAnalytics[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      totalProducts: number;
      totalQuantitySold: number;
      totalRevenue: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    const response = await this.client.get(`/admin/purchases?${params}`);
    return response.data;
  }

  async getTotalRevenue(startDate?: string, endDate?: string, status?: string): Promise<any> {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);

    const response = await this.client.get<ApiResponse<any>>(`/admin/total-revenue?${params}`);
    return response.data.data;
  }

  async getDiscountCodes(
    page = 1,
    limit = 20,
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
      sortBy,
      sortOrder,
    });

    const response = await this.client.get<PaginatedResponse<any>>(
      `/admin/discount-codes?${params}`
    );
    return response.data;
  }

  async getTotalDiscountAmount(
    startDate?: string,
    endDate?: string,
    discountType = 'all'
  ): Promise<any> {
    const params = new URLSearchParams({
      discountType,
    });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.client.get<ApiResponse<any>>(`/admin/total-discount?${params}`);
    return response.data.data;
  }

  async getDashboardStats(): Promise<AdminStats> {
    const response = await this.client.get<ApiResponse<AdminStats>>('/admin/dashboard');
    return response.data.data!;
  }

  async getAllUsers(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await this.client.get<PaginatedResponse<any>>(`/admin/users?${params}`);
    return response.data;
  }

  async generateCoupon(data: any): Promise<Coupon> {
    const response = await this.client.post<ApiResponse<Coupon>>('/coupons/generate', data);
    return response.data.data!;
  }

  async getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.client.get<PaginatedResponse<User>>(`/admin/users?${searchParams}`);
    return response.data;
  }

  async getAdminProducts(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.client.get<PaginatedResponse<Product>>(
      `/admin/products?${searchParams}`
    );
    return response.data;
  }

  async getAdminOrders(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.client.get<PaginatedResponse<Order>>(
      `/orders/admin/all?${searchParams}`
    );
    return response.data;
  }

  // Order Management
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await this.client.put<ApiResponse<Order>>(`/orders/admin/${id}/status`, {
      status,
    });
    return response.data.data!;
  }

  // Product Management
  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    stock: number;
  }): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>('/products', productData);
    return response.data.data!;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
