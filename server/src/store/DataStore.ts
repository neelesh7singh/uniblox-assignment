/**
 * In-memory data store for the E-commerce application
 * This class provides a singleton instance to manage all application data
 * using Maps and arrays for efficient data operations
 */

import { v4 as uuidv4 } from "uuid";
import {
  User,
  Product,
  Cart,
  Order,
  Coupon,
  OrderStatus,
  DiscountType,
} from "../types";

export class DataStore {
  private static instance: DataStore;

  // Data storage using Maps for efficient lookups
  private users = new Map<string, User>();
  private products = new Map<string, Product>();
  private carts = new Map<string, Cart>(); // Key: userId
  private orders = new Map<string, Order>();
  private coupons = new Map<string, Coupon>();

  // Additional indexes for efficient queries
  private usersByEmail = new Map<string, User>();
  private ordersByUser = new Map<string, Order[]>();
  private couponsByCode = new Map<string, Coupon>();

  private constructor() {
    this.initializeSampleData();
  }

  /**
   * Get singleton instance of DataStore
   */
  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  /**
   * Initialize sample data for testing and development
   */
  private initializeSampleData(): void {
    // Sample products
    const sampleProducts: Omit<Product, "id">[] = [
      {
        name: "iPhone 15 Pro",
        description: "Latest Apple iPhone with A17 Pro chip",
        price: 999.99,
        category: "Electronics",
        imageUrl: "https://example.com/iphone15.jpg",
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "MacBook Air M2",
        description: "Powerful laptop with M2 chip",
        price: 1199.99,
        category: "Electronics",
        imageUrl: "https://example.com/macbook.jpg",
        stock: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "AirPods Pro",
        description: "Wireless earbuds with noise cancellation",
        price: 249.99,
        category: "Electronics",
        imageUrl: "https://example.com/airpods.jpg",
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Nike Air Max",
        description: "Comfortable running shoes",
        price: 129.99,
        category: "Shoes",
        imageUrl: "https://example.com/nike.jpg",
        stock: 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Coffee Maker",
        description: "Premium coffee brewing machine",
        price: 89.99,
        category: "Home",
        imageUrl: "https://example.com/coffee.jpg",
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleProducts.forEach((productData) => {
      const product: Product = {
        id: uuidv4(),
        ...productData,
      };
      this.products.set(product.id, product);
    });

    // Sample admin user
    const adminUser: User = {
      id: uuidv4(),
      email: "admin@uniblox.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.addUser(adminUser);
  }

  // User operations
  public addUser(user: User): User {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    return user;
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email);
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Product operations
  public addProduct(product: Product): Product {
    this.products.set(product.id, product);
    return product;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public getAllProducts(): Product[] {
    return Array.from(this.products.values()).filter((p) => p.isActive);
  }

  public updateProductStock(productId: string, newStock: number): boolean {
    const product = this.products.get(productId);
    if (product) {
      product.stock = newStock;
      product.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Cart operations
  public getCartByUserId(userId: string): Cart | undefined {
    return this.carts.get(userId);
  }

  public createOrUpdateCart(cart: Cart): Cart {
    this.carts.set(cart.userId, cart);
    return cart;
  }

  public clearCart(userId: string): boolean {
    return this.carts.delete(userId);
  }

  // Order operations
  public addOrder(order: Order): Order {
    this.orders.set(order.id, order);

    // Update user orders index
    const userOrders = this.ordersByUser.get(order.userId) || [];
    userOrders.push(order);
    this.ordersByUser.set(order.userId, userOrders);

    return order;
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getOrdersByUserId(userId: string): Order[] {
    return this.ordersByUser.get(userId) || [];
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Coupon operations
  public addCoupon(coupon: Coupon): Coupon {
    this.coupons.set(coupon.id, coupon);
    this.couponsByCode.set(coupon.code, coupon);
    return coupon;
  }

  public getCouponById(id: string): Coupon | undefined {
    return this.coupons.get(id);
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.couponsByCode.get(code);
  }

  public getAllCoupons(): Coupon[] {
    return Array.from(this.coupons.values());
  }

  public markCouponAsUsed(couponId: string, userId: string): boolean {
    const coupon = this.coupons.get(couponId);
    if (coupon && !coupon.isUsed) {
      coupon.isUsed = true;
      coupon.usedBy = userId;
      coupon.usedAt = new Date();
      return true;
    }
    return false;
  }

  // Analytics and admin operations
  public getTotalRevenue(): number {
    return Array.from(this.orders.values())
      .filter((order) => order.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.total, 0);
  }

  public getTotalDiscountGiven(): number {
    return Array.from(this.orders.values())
      .filter((order) => order.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.discountAmount, 0);
  }

  public getProductPurchaseStats(): Map<
    string,
    { quantity: number; revenue: number; name: string }
  > {
    const stats = new Map<
      string,
      { quantity: number; revenue: number; name: string }
    >();

    Array.from(this.orders.values())
      .filter((order) => order.status !== OrderStatus.CANCELLED)
      .forEach((order) => {
        order.items.forEach((item) => {
          const existing = stats.get(item.productId) || {
            quantity: 0,
            revenue: 0,
            name: item.productName,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
          stats.set(item.productId, existing);
        });
      });

    return stats;
  }

  public getUserOrderCount(userId: string): number {
    return (this.ordersByUser.get(userId) || []).filter(
      (order) => order.status !== OrderStatus.CANCELLED
    ).length;
  }

  // Utility methods for testing and development
  public reset(): void {
    this.users.clear();
    this.products.clear();
    this.carts.clear();
    this.orders.clear();
    this.coupons.clear();
    this.usersByEmail.clear();
    this.ordersByUser.clear();
    this.couponsByCode.clear();
    this.initializeSampleData();
  }

  public getStats(): {
    users: number;
    products: number;
    orders: number;
    coupons: number;
  } {
    return {
      users: this.users.size,
      products: this.products.size,
      orders: this.orders.size,
      coupons: this.coupons.size,
    };
  }
}
