/**
 * Core TypeScript interfaces and types for the E-commerce API
 * These types define the data structure for the entire application
 */

export interface User {
  id: string;
  email: string;
  password: string; // Will be hashed
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string; // Snapshot of product name at time of order
  productPrice: number; // Snapshot of price at time of order
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
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number; // Percentage or fixed amount
  isUsed: boolean;
  usedBy?: string; // User ID who used the coupon
  usedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export enum CouponStatus {
  GENERATED = "GENERATED",
  APPLIED = "APPLIED",
}

// API Request/Response Types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
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

// Admin Analytics Types
export interface PurchaseAnalytics {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalDiscountGiven: number;
  totalCouponsGenerated: number;
  totalCouponsUsed: number;
}

export interface CouponAnalytics {
  id: string;
  code: string;
  status: CouponStatus;
  discountAmount: number;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
}

// Utility types
export type UserWithoutPassword = Omit<User, "password">;
export type CreateProductRequest = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateProductRequest = Partial<CreateProductRequest>;

// Error types
export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}
