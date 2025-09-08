/**
 * Order route tests
 * Tests for checkout, order history, nth order discounts, and order management
 */

import request from "supertest";
import app from "../index";
import { DataStore } from "../store/DataStore";
import { OrderStatus } from "../types";

describe("Order Routes", () => {
  let dataStore: DataStore;
  let authToken: string;
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    dataStore = DataStore.getInstance();

    // Create and authenticate user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "TestPass123",
      firstName: "John",
      lastName: "Doe",
    });

    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;

    // Get a product ID from sample data
    const productsResponse = await request(app)
      .get("/api/products")
      .expect(200);

    productId = productsResponse.body.data[0].id;

    // Add item to cart for checkout tests
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        productId,
        quantity: 2,
      });
  });

  describe("POST /api/orders/checkout", () => {
    it("should process checkout successfully", async () => {
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body.message).toBe("Order placed successfully");
      expect(response.body.data).toHaveProperty("order");

      const { order } = response.body.data;
      expect(order.id).toBeValidUUID();
      expect(order.userId).toBe(userId);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe(productId);
      expect(order.items[0].quantity).toBe(2);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.subtotal).toBeGreaterThan(0);
      expect(order.total).toBeGreaterThan(0);
    });

    it("should handle nth order discount (3rd order)", async () => {
      // Place first order
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Add item to cart for second order
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId, quantity: 1 });

      // Place second order
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Add item to cart for third order
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId, quantity: 1 });

      // Place third order (should get nth order discount)
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body.message).toContain("You received a 10% discount");
      expect(response.body.specialDiscount).toHaveProperty("isNthOrder", true);
      expect(response.body.specialDiscount.orderNumber).toBe(3);
      expect(response.body.specialDiscount.discountPercentage).toBe(10);

      const { order } = response.body.data;
      expect(order.discountAmount).toBeGreaterThan(0);
      expect(order.discountCode).toContain("SPECIAL3ORDER");
      expect(order.total).toBeLessThan(order.subtotal);
    });

    it("should apply manual coupon successfully", async () => {
      // Create admin user and generate coupon
      const adminResponse = await request(app).post("/api/auth/register").send({
        email: "admin@example.com",
        password: "AdminPass123",
        firstName: "Admin",
        lastName: "User",
      });

      // Manually set admin status (in real app, this would be done through admin interface)
      const admin = dataStore.getUserByEmail("admin@example.com");
      if (admin) {
        admin.isAdmin = true;
        dataStore.addUser(admin);
      }

      // Re-login to get a new token with admin privileges
      const adminLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@example.com",
          password: "AdminPass123",
        });

      // Generate coupon
      const couponResponse = await request(app)
        .post("/api/coupons/generate")
        .set("Authorization", `Bearer ${adminLoginResponse.body.data.token}`)
        .send({
          discountType: "PERCENTAGE",
          discountValue: 15,
        })
        .expect(201);

      const couponCode = couponResponse.body.data.code;

      // Use coupon in checkout
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ couponCode })
        .expect(201);

      const { order } = response.body.data;
      expect(order.discountCode).toBe(couponCode);
      expect(order.discountAmount).toBeGreaterThan(0);
      expect(order.total).toBeLessThan(order.subtotal);
    });

    it("should reject checkout with empty cart", async () => {
      // Clear cart first
      await request(app)
        .delete("/api/cart")
        .set("Authorization", `Bearer ${authToken}`);

      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(response.body.error).toBe("Cart is empty");
    });

    it("should reject checkout with invalid coupon", async () => {
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ couponCode: "INVALID123" })
        .expect(422);

      expect(response.body.error).toBe("Invalid coupon code");
    });

    it("should update product stock after checkout", async () => {
      // Get initial stock
      const initialProductResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      const initialStock = initialProductResponse.body.data.stock;

      // Checkout
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(201);

      // Check updated stock
      const updatedProductResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      const updatedStock = updatedProductResponse.body.data.stock;
      expect(updatedStock).toBe(initialStock - 2); // We added 2 items to cart
    });

    it("should clear cart after successful checkout", async () => {
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(201);

      // Check that cart is empty
      const cartResponse = await request(app)
        .get("/api/cart")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(0);
      expect(cartResponse.body.data.isEmpty).toBe(true);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/orders/checkout")
        .send({})
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("GET /api/orders/history", () => {
    beforeEach(async () => {
      // Create some orders for testing
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Add another item and create second order
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId, quantity: 1 });

      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
    });

    it("should get user order history", async () => {
      const response = await request(app)
        .get("/api/orders/history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        "Order history retrieved successfully"
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty("total", 2);

      // Orders should be sorted by creation date (most recent first)
      expect(
        new Date(response.body.data[0].createdAt).getTime()
      ).toBeGreaterThanOrEqual(
        new Date(response.body.data[1].createdAt).getTime()
      );
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/orders/history?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/api/orders/history?status=PENDING")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((order: any) => {
        expect(order.status).toBe("PENDING");
      });
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/orders/history")
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("GET /api/orders/:id", () => {
    let orderId: string;

    beforeEach(async () => {
      const orderResponse = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      orderId = orderResponse.body.data.order.id;
    });

    it("should get specific order details", async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe("Order retrieved successfully");
      expect(response.body.data.id).toBe(orderId);
      expect(response.body.data.userId).toBe(userId);
    });

    it("should reject access to other user's orders", async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "other@example.com",
          password: "TestPass123",
          firstName: "Other",
          lastName: "User",
        });

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${otherUserResponse.body.data.token}`)
        .expect(404);

      expect(response.body.error).toBe(`Order with ID ${orderId} not found`);
    });

    it("should return 404 for non-existent order", async () => {
      const fakeId = "12345678-1234-4234-a234-123456789012";
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe(`Order with ID ${fakeId} not found`);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("GET /api/orders/stats/summary", () => {
    beforeEach(async () => {
      // Create multiple orders for stats
      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Add item and create second order
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId, quantity: 1 });

      await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
    });

    it("should get user order statistics", async () => {
      const response = await request(app)
        .get("/api/orders/stats/summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe(
        "Order statistics retrieved successfully"
      );
      expect(response.body.data).toHaveProperty("totalOrders", 2);
      expect(response.body.data).toHaveProperty("completedOrders", 2);
      expect(response.body.data).toHaveProperty("totalSpent");
      expect(response.body.data).toHaveProperty("totalSaved");
      expect(response.body.data).toHaveProperty("totalItems");
      expect(response.body.data).toHaveProperty("nextDiscountOrder");
      expect(response.body.data).toHaveProperty("ordersUntilDiscount");

      expect(response.body.data.totalSpent).toBeGreaterThan(0);
      expect(response.body.data.nextDiscountOrder).toBe(3); // Next discount is 3rd order
      expect(response.body.data.ordersUntilDiscount).toBe(1); // 1 more order until discount
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/orders/stats/summary")
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("PUT /api/orders/:id/cancel", () => {
    let orderId: string;
    let originalStock: number;

    beforeEach(async () => {
      // Get initial stock
      const productResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);
      originalStock = productResponse.body.data.stock;

      // Create order
      const orderResponse = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      orderId = orderResponse.body.data.order.id;
    });

    it("should cancel pending order successfully", async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe("Order cancelled successfully");
      expect(response.body.data.status).toBe(OrderStatus.CANCELLED);
    });

    it("should restore product stock when order is cancelled", async () => {
      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Check that stock was restored
      const productResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(productResponse.body.data.stock).toBe(originalStock);
    });

    it("should not cancel non-pending orders", async () => {
      // First update order status to CONFIRMED (simulating admin action)
      dataStore.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(422);

      expect(response.body.error).toBe(
        "Cannot cancel order with status: CONFIRMED"
      );
    });

    it("should not allow canceling other user's orders", async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "other@example.com",
          password: "TestPass123",
          firstName: "Other",
          lastName: "User",
        });

      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${otherUserResponse.body.data.token}`)
        .expect(404);

      expect(response.body.error).toBe(`Order with ID ${orderId} not found`);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .expect(401);

      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("Nth Order Discount Logic", () => {
    it("should apply discount on every 3rd order", async () => {
      const orders = [];

      // Place first 6 orders and check discount application
      for (let i = 1; i <= 6; i++) {
        // Add item to cart
        await request(app)
          .post("/api/cart/add")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ productId, quantity: 1 });

        // Checkout
        const response = await request(app)
          .post("/api/orders/checkout")
          .set("Authorization", `Bearer ${authToken}`)
          .send({});

        orders.push(response.body.data.order);

        // Check if it's a discount order (3rd and 6th)
        if (i % 3 === 0) {
          expect(response.body.specialDiscount).toHaveProperty(
            "isNthOrder",
            true
          );
          expect(response.body.specialDiscount.orderNumber).toBe(i);
          expect(response.body.data.order.discountAmount).toBeGreaterThan(0);
          expect(response.body.data.order.discountCode).toContain(
            `SPECIAL${i}ORDER`
          );
        } else {
          expect(response.body.specialDiscount).toBeUndefined();
          expect(response.body.data.order.discountAmount).toBe(0);
        }
      }
    });

    it("should generate unique nth order coupons", async () => {
      // Place 3 orders to trigger first nth order discount
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post("/api/cart/add")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ productId, quantity: 1 });

        await request(app)
          .post("/api/orders/checkout")
          .set("Authorization", `Bearer ${authToken}`)
          .send({});
      }

      // Check that nth order coupon was created and used
      const allCoupons = dataStore.getAllCoupons();
      const nthOrderCoupons = allCoupons.filter(
        (c) => c.code.includes("SPECIAL3ORDER") && c.isUsed
      );

      expect(nthOrderCoupons).toHaveLength(1);
      expect(nthOrderCoupons[0].usedBy).toBe(userId);
      expect(nthOrderCoupons[0].discountValue).toBe(10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle insufficient stock during checkout", async () => {
      // Set product stock to 1
      dataStore.updateProductStock(productId, 1);

      // Try to checkout with 2 items (we added 2 to cart in beforeEach)
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(response.body.error).toContain("Insufficient stock");
    });

    it("should handle product becoming inactive during checkout", async () => {
      // Make product inactive
      const product = dataStore.getProductById(productId);
      if (product) {
        product.isActive = false;
        dataStore.addProduct(product);
      }

      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(response.body.error).toContain("is no longer available");
    });
  });
});
