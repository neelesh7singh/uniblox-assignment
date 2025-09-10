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
    // Sample products with real image URLs
    const sampleProducts: Omit<Product, "id">[] = [
      // Electronics
      {
        name: "iPhone 15 Pro",
        description:
          "Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system",
        price: 999.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&crop=center",
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "MacBook Air M2",
        description:
          "Powerful laptop with M2 chip, 13-inch Liquid Retina display, and all-day battery life",
        price: 1199.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&crop=center",
        stock: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "AirPods Pro",
        description:
          "Wireless earbuds with active noise cancellation and spatial audio",
        price: 249.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop&crop=center",
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Samsung Galaxy S24",
        description:
          "Premium Android smartphone with AI-powered camera and 120Hz display",
        price: 899.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop&crop=center",
        stock: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sony WH-1000XM5",
        description:
          "Industry-leading noise canceling wireless headphones with 30-hour battery",
        price: 399.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop&crop=center",
        stock: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "iPad Pro 12.9-inch",
        description:
          "Professional tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil support",
        price: 1099.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center",
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dell XPS 13",
        description:
          "Ultra-thin laptop with 13.4-inch InfinityEdge display and 11th Gen Intel Core processor",
        price: 1299.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop&crop=center",
        stock: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Nintendo Switch OLED",
        description:
          "Gaming console with 7-inch OLED screen, enhanced audio, and 64GB storage",
        price: 349.99,
        category: "Electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop&crop=center",
        stock: 35,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Fashion & Clothing
      {
        name: "Nike Air Max 270",
        description:
          "Comfortable running shoes with Max Air cushioning and breathable mesh upper",
        price: 129.99,
        category: "Shoes",
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop&crop=center",
        stock: 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Adidas Ultraboost 22",
        description:
          "High-performance running shoes with responsive Boost midsole and Primeknit upper",
        price: 180.99,
        category: "Shoes",
        imageUrl:
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop&crop=center",
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Levi's 501 Original Jeans",
        description:
          "Classic straight-fit jeans in authentic blue denim, made with 100% cotton",
        price: 89.99,
        category: "Clothing",
        imageUrl:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop&crop=center",
        stock: 80,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Patagonia Better Sweater",
        description:
          "Sustainable fleece jacket made from recycled polyester, perfect for outdoor adventures",
        price: 149.99,
        category: "Clothing",
        imageUrl:
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&h=500&fit=crop&crop=center",
        stock: 45,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Converse Chuck Taylor All Star",
        description:
          "Iconic canvas sneakers with rubber toe cap and classic high-top design",
        price: 65.99,
        category: "Shoes",
        imageUrl:
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop&crop=center",
        stock: 120,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Home & Kitchen
      {
        name: "Breville Barista Express",
        description:
          "Espresso machine with built-in grinder, 15-bar pump, and precise temperature control",
        price: 599.99,
        category: "Home",
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&fit=crop&crop=center",
        stock: 15,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "KitchenAid Stand Mixer",
        description:
          "Professional-grade stand mixer with 5-quart bowl and 10-speed settings",
        price: 379.99,
        category: "Home",
        imageUrl:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop&crop=center",
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dyson V15 Detect",
        description:
          "Cordless vacuum with laser dust detection and 60-minute runtime",
        price: 749.99,
        category: "Home",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&crop=center",
        stock: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Instant Pot Duo 7-in-1",
        description:
          "Electric pressure cooker with 7 cooking functions and 6-quart capacity",
        price: 99.99,
        category: "Home",
        imageUrl:
          "https://images.unsplash.com/photo-1585515656519-4b1b0b0b0b0b?w=500&h=500&fit=crop&crop=center",
        stock: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Casper Original Mattress",
        description:
          "Memory foam mattress with zoned support and breathable design for better sleep",
        price: 1095.99,
        category: "Home",
        imageUrl:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop&crop=center",
        stock: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Sports & Fitness
      {
        name: "Peloton Bike+",
        description:
          "Interactive fitness bike with 24-inch HD touchscreen and live classes",
        price: 2495.99,
        category: "Sports",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop&crop=center",
        stock: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Yoga Mat Premium",
        description:
          "Non-slip yoga mat with extra cushioning and carrying strap included",
        price: 49.99,
        category: "Sports",
        imageUrl:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop&crop=center",
        stock: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Garmin Forerunner 945",
        description:
          "GPS running watch with heart rate monitoring and 2-week battery life",
        price: 599.99,
        category: "Sports",
        imageUrl:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&crop=center",
        stock: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Books & Media
      {
        name: "Kindle Paperwhite",
        description:
          "Waterproof e-reader with 6.8-inch display and adjustable warm light",
        price: 139.99,
        category: "Books",
        imageUrl:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop&crop=center",
        stock: 45,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "The Psychology of Money",
        description:
          "Bestselling book about the psychology of wealth and financial decision-making",
        price: 16.99,
        category: "Books",
        imageUrl:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop&crop=center",
        stock: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Beauty & Personal Care
      {
        name: "Dyson Supersonic Hair Dryer",
        description:
          "Professional hair dryer with intelligent heat control and fast drying",
        price: 429.99,
        category: "Beauty",
        imageUrl:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=500&fit=crop&crop=center",
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "The Ordinary Niacinamide 10%",
        description:
          "Serum for reducing blemishes and balancing oil production",
        price: 12.99,
        category: "Beauty",
        imageUrl:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop&crop=center",
        stock: 80,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Automotive
      {
        name: "Car Phone Mount",
        description:
          "Magnetic phone mount with 360-degree rotation and strong grip",
        price: 24.99,
        category: "Automotive",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&crop=center",
        stock: 90,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dash Cam 4K",
        description: "Ultra HD dash cam with night vision and loop recording",
        price: 199.99,
        category: "Automotive",
        imageUrl:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=500&fit=crop&crop=center",
        stock: 35,
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

    // Sample regular user for testing
    const regularUser: User = {
      id: uuidv4(),
      email: "test@example.com",
      password: "$2a$10$sAHbBeVOg2s8FujPLl6xA.iuWXCeVHOFlzhsPaoO6ysK20Oq.t8zi", // TestPass123
      firstName: "John",
      lastName: "Doe",
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.addUser(adminUser);
    this.addUser(regularUser);
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
