/**
 * Order routes for checkout, order history, and order management
 * Includes the special nth order discount logic and order tracking
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { DataStore } from "../store/DataStore";
import {
  Order,
  OrderItem,
  OrderStatus,
  CheckoutRequest,
  CheckoutResponse,
  Coupon,
  DiscountType,
} from "../types";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  validate,
  orderSchemas,
  sanitizeRequest,
} from "../middleware/validation";
import { rateLimiters } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";
import {
  NotFoundError,
  BusinessLogicError,
  AuthenticationError,
} from "../middleware/errorHandler";
import Joi from "joi";

const router = Router();
const dataStore = DataStore.getInstance();

// Configuration for nth order discount
const NTH_ORDER_DISCOUNT = {
  percentage: 10, // 10% discount
  orderInterval: 3, // Every 3rd order
};

/**
 * Helper function to generate automatic discount coupon for nth order
 */
const generateNthOrderCoupon = (
  userId: string,
  orderNumber: number
): Coupon => {
  return {
    id: uuidv4(),
    code: `SPECIAL${orderNumber}ORDER_${userId.substring(0, 8)}`,
    discountType: DiscountType.PERCENTAGE,
    discountValue: NTH_ORDER_DISCOUNT.percentage,
    isUsed: false,
    createdAt: new Date(),
  };
};

/**
 * POST /api/orders/checkout
 * Process checkout and create order
 * Includes automatic nth order discount logic
 */
router.post(
  "/checkout",
  authenticateToken,
  rateLimiters.strict,
  sanitizeRequest,
  validate(orderSchemas.checkout),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { couponCode } = req.body as CheckoutRequest;

    // Get user's cart
    const cart = dataStore.getCartByUserId(req.user.userId);
    if (!cart || cart.items.length === 0) {
      throw new BusinessLogicError("Cart is empty");
    }

    // Validate cart items and calculate totals
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = dataStore.getProductById(cartItem.productId);

      if (!product || !product.isActive) {
        throw new BusinessLogicError(
          `Product ${cartItem.productId} is no longer available`
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BusinessLogicError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
        );
      }

      const itemSubtotal = product.price * cartItem.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: cartItem.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Get user's order count for nth order discount logic
    const userOrderCount = dataStore.getUserOrderCount(req.user.userId);
    const orderNumber = userOrderCount + 1; // This will be their next order number

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    let automaticDiscountCoupon: Coupon | undefined;

    // Check for nth order discount (every 3rd order)
    const isNthOrder =
      orderNumber > 0 && orderNumber % NTH_ORDER_DISCOUNT.orderInterval === 0;

    if (isNthOrder) {
      // Generate automatic discount coupon for nth order
      automaticDiscountCoupon = generateNthOrderCoupon(
        req.user.userId,
        orderNumber
      );
      discountAmount = (subtotal * NTH_ORDER_DISCOUNT.percentage) / 100;
      appliedCouponCode = automaticDiscountCoupon.code;

      // Save the coupon and mark as used
      automaticDiscountCoupon.isUsed = true;
      automaticDiscountCoupon.usedBy = req.user.userId;
      automaticDiscountCoupon.usedAt = new Date();
      dataStore.addCoupon(automaticDiscountCoupon);
    } else if (couponCode) {
      // Check for manual coupon code
      const coupon = dataStore.getCouponByCode(couponCode);

      if (!coupon) {
        throw new BusinessLogicError("Invalid coupon code");
      }

      if (coupon.isUsed) {
        throw new BusinessLogicError("Coupon has already been used");
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new BusinessLogicError("Coupon has expired");
      }

      // Apply coupon discount
      if (coupon.discountType === DiscountType.PERCENTAGE) {
        discountAmount = (subtotal * coupon.discountValue) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }

      appliedCouponCode = coupon.code;

      // Mark coupon as used
      dataStore.markCouponAsUsed(coupon.id, req.user.userId);
    }

    const total = Math.max(0, subtotal - discountAmount);

    // Create order
    const newOrder: Order = {
      id: uuidv4(),
      userId: req.user.userId,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountCode: appliedCouponCode,
      total: Math.round(total * 100) / 100,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save order
    const savedOrder = dataStore.addOrder(newOrder);

    // Update product stock
    for (const cartItem of cart.items) {
      const product = dataStore.getProductById(cartItem.productId);
      if (product) {
        const newStock = product.stock - cartItem.quantity;
        dataStore.updateProductStock(product.id, Math.max(0, newStock));
      }
    }

    // Clear user's cart
    dataStore.clearCart(req.user.userId);

    // Prepare response
    const response: CheckoutResponse = {
      order: savedOrder,
    };

    if (appliedCouponCode) {
      response.appliedDiscount = {
        code: appliedCouponCode,
        amount: discountAmount,
      };
    }

    // Add special message for nth order discount
    const message = isNthOrder
      ? `Order placed successfully! You received a ${NTH_ORDER_DISCOUNT.percentage}% discount on your ${orderNumber}th order!`
      : "Order placed successfully";

    res.status(201).json({
      message,
      data: response,
      ...(isNthOrder && {
        specialDiscount: {
          isNthOrder: true,
          orderNumber,
          discountPercentage: NTH_ORDER_DISCOUNT.percentage,
          message: `Congratulations! You received ${NTH_ORDER_DISCOUNT.percentage}% off your ${orderNumber}th order!`,
        },
      }),
    });
  })
);

/**
 * GET /api/orders/history
 * Get current user's order history
 */
router.get(
  "/history",
  authenticateToken,
  rateLimiters.general,
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(10),
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { page = 1, limit = 10, status } = req.query;

    let orders = dataStore.getOrdersByUserId(req.user.userId);

    // Filter by status if provided
    if (status) {
      orders = orders.filter((order) => order.status === status);
    }

    // Sort by creation date (most recent first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      message: "Order history retrieved successfully",
      data: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: orders.length,
        pages: Math.ceil(orders.length / limitNum),
      },
    });
  })
);

/**
 * GET /api/orders/:id
 * Get specific order details
 */
router.get(
  "/:id",
  authenticateToken,
  rateLimiters.general,
  validate(orderSchemas.getById),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { id } = req.params;
    const order = dataStore.getOrderById(id);

    if (!order) {
      throw new NotFoundError("Order", id);
    }

    // Ensure user can only access their own orders (unless admin)
    if (!req.user.isAdmin && order.userId !== req.user.userId) {
      throw new NotFoundError("Order", id);
    }

    res.json({
      message: "Order retrieved successfully",
      data: order,
    });
  })
);

/**
 * GET /api/orders/stats/summary
 * Get user's order statistics
 */
router.get(
  "/stats/summary",
  authenticateToken,
  rateLimiters.general,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const orders = dataStore.getOrdersByUserId(req.user.userId);
    const completedOrders = orders.filter(
      (order) => order.status !== OrderStatus.CANCELLED
    );

    const totalSpent = completedOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const totalDiscount = completedOrders.reduce(
      (sum, order) => sum + order.discountAmount,
      0
    );
    const totalItems = completedOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    // Calculate next discount order and orders until discount
    const currentOrderCount = orders.length;
    const nextDiscountOrder =
      Math.ceil((currentOrderCount + 1) / NTH_ORDER_DISCOUNT.orderInterval) *
      NTH_ORDER_DISCOUNT.orderInterval;
    const ordersUntilDiscount = nextDiscountOrder - currentOrderCount;

    const stats = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalSaved: Math.round(totalDiscount * 100) / 100,
      totalItems,
      nextDiscountOrder,
      ordersUntilDiscount,
    };

    res.json({
      message: "Order statistics retrieved successfully",
      data: stats,
    });
  })
);

/**
 * PUT /api/orders/:id/cancel
 * Cancel an order (only if still pending)
 */
router.put(
  "/:id/cancel",
  authenticateToken,
  rateLimiters.strict,
  validate(orderSchemas.getById),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { id } = req.params;
    const order = dataStore.getOrderById(id);

    if (!order) {
      throw new NotFoundError("Order", id);
    }

    // Ensure user can only cancel their own orders (unless admin)
    if (!req.user.isAdmin && order.userId !== req.user.userId) {
      throw new NotFoundError("Order", id);
    }

    // Can only cancel pending orders
    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessLogicError(
        `Cannot cancel order with status: ${order.status}`
      );
    }

    // Update order status
    const updated = dataStore.updateOrderStatus(id, OrderStatus.CANCELLED);
    if (!updated) {
      throw new BusinessLogicError("Failed to cancel order");
    }

    // Restore product stock
    for (const item of order.items) {
      const product = dataStore.getProductById(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        dataStore.updateProductStock(product.id, newStock);
      }
    }

    // If a coupon was used, mark it as unused (restore it)
    if (order.discountCode) {
      const coupon = dataStore.getCouponByCode(order.discountCode);
      if (coupon && coupon.isUsed) {
        coupon.isUsed = false;
        coupon.usedBy = undefined;
        coupon.usedAt = undefined;
        dataStore.addCoupon(coupon);
      }
    }

    const updatedOrder = dataStore.getOrderById(id);

    res.json({
      message: "Order cancelled successfully",
      data: updatedOrder,
    });
  })
);

// Admin-only routes

/**
 * GET /api/orders/admin/all
 * Get all orders (Admin only)
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional(),
      userId: Joi.string().uuid().optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, status, userId } = req.query;

    let orders = dataStore.getAllOrders();

    // Apply filters
    if (status) {
      orders = orders.filter((order) => order.status === status);
    }

    if (userId) {
      orders = orders.filter((order) => order.userId === userId);
    }

    // Sort by creation date (most recent first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      message: "All orders retrieved successfully",
      data: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: orders.length,
        pages: Math.ceil(orders.length / limitNum),
      },
    });
  })
);

/**
 * PUT /api/orders/admin/:id/status
 * Update order status (Admin only)
 */
router.put(
  "/admin/:id/status",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  sanitizeRequest,
  validate(orderSchemas.updateStatus),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const order = dataStore.getOrderById(id);
    if (!order) {
      throw new NotFoundError("Order", id);
    }

    // Update order status
    const updated = dataStore.updateOrderStatus(id, status as OrderStatus);
    if (!updated) {
      throw new BusinessLogicError("Failed to update order status");
    }

    const updatedOrder = dataStore.getOrderById(id);

    res.json({
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  })
);

export default router;
