/**
 * TypeScript type definitions for the Uniblox E-commerce frontend
 * These types match the backend API structure
 */

// Error types
export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Product related types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

// Cart related types
export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface CartItemWithDetails {
  productId: string;
  quantity: number;
  addedAt: string;
  product: Product;
  subtotal: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItemWithDetails[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Order related types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  couponCode?: string;
}

export interface CheckoutResponse {
  order: Order;
  appliedDiscount?: {
    code: string;
    amount: number;
  };
}

// Coupon related types
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponStatus {
  GENERATED = 'GENERATED',
  APPLIED = 'APPLIED',
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// Admin related types

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalCoupons: number;
  totalDiscountGiven: number;
  recentActivity: {
    ordersLastWeek: number;
    revenueLastWeek: number;
    newUsersLastWeek: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// Route types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

// Admin Analytics Types
export interface PurchaseAnalytics {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface PurchaseAnalyticsSummary {
  totalPurchases: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalDiscountAmount: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  purchasesByStatus: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

// Store types for Zustand
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface CartStore {
  cart: Cart | null;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  fetchCart: () => Promise<void>;
}

export interface AppStore {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationState[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
}
