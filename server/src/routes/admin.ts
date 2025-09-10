/**
 * Admin routes for analytics, reporting, and administrative functions
 * Provides comprehensive insights into purchases, revenue, and discount usage
 */

import { Router, Request, Response } from "express";
import { DataStore } from "../store/DataStore";
import {
  PurchaseAnalytics,
  AdminStats,
  CouponAnalytics,
  CouponStatus,
  OrderStatus,
} from "../types";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { validate, adminSchemas } from "../middleware/validation";
import { rateLimiters } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";
import Joi from "joi";

const router = Router();
const dataStore = DataStore.getInstance();

// All admin routes require authentication and admin privileges
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/purchases
 * Get list of items that have been purchased with quantities and revenue
 */
router.get(
  "/purchases",
  rateLimiters.admin,
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string()
        .valid("productName", "totalQuantity", "totalRevenue")
        .default("totalRevenue"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 20,
      sortBy = "totalRevenue",
      sortOrder = "desc",
    } = req.query;

    const purchaseStats = dataStore.getProductPurchaseStats();

    // Convert Map to array for easier manipulation
    const purchaseAnalytics: PurchaseAnalytics[] = Array.from(
      purchaseStats.entries()
    ).map(([productId, stats]) => ({
      productId,
      productName: stats.name,
      totalQuantity: stats.quantity,
      totalRevenue: Math.round(stats.revenue * 100) / 100,
    }));

    // Apply sorting
    purchaseAnalytics.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "productName":
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case "totalQuantity":
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case "totalRevenue":
        default:
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = purchaseAnalytics.slice(startIndex, endIndex);

    // Calculate totals
    const totalQuantityAllProducts = purchaseAnalytics.reduce(
      (sum, item) => sum + item.totalQuantity,
      0
    );
    const totalRevenueAllProducts = purchaseAnalytics.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );

    res.json({
      message: "Purchase analytics retrieved successfully",
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: purchaseAnalytics.length,
        pages: Math.ceil(purchaseAnalytics.length / limitNum),
      },
      summary: {
        totalProducts: purchaseAnalytics.length,
        totalQuantitySold: totalQuantityAllProducts,
        totalRevenue: Math.round(totalRevenueAllProducts * 100) / 100,
      },
    });
  })
);

/**
 * GET /api/admin/total-revenue
 * Get total purchase amount across all orders
 */
router.get(
  "/total-revenue",
  rateLimiters.admin,
  validate({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, status } = req.query;

    let orders = dataStore.getAllOrders();

    // Filter by status (exclude cancelled by default)
    if (status) {
      orders = orders.filter((order) => order.status === status);
    } else {
      orders = orders.filter((order) => order.status !== OrderStatus.CANCELLED);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      orders = orders.filter((order) => order.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // End of day
      orders = orders.filter((order) => order.createdAt <= end);
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalSubtotal = orders.reduce(
      (sum, order) => sum + order.subtotal,
      0
    );
    const totalDiscount = orders.reduce(
      (sum, order) => sum + order.discountAmount,
      0
    );
    const averageOrderValue =
      orders.length > 0 ? totalRevenue / orders.length : 0;

    const revenueData = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSubtotal: Math.round(totalSubtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalOrders: orders.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || "all except cancelled",
      },
    };

    res.json({
      message: "Revenue data retrieved successfully",
      data: revenueData,
    });
  })
);

/**
 * GET /api/admin/discount-codes
 * Get list of all discount codes and their status (Applied/Generated)
 */
router.get(
  "/discount-codes",
  rateLimiters.admin,
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string().valid("all", "applied", "generated").default("all"),
      sortBy: Joi.string()
        .valid("createdAt", "usedAt", "discountAmount")
        .default("createdAt"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 20,
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const allCoupons = dataStore.getAllCoupons();

    // Transform coupons to analytics format
    const couponAnalytics: CouponAnalytics[] = allCoupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      status: coupon.isUsed ? CouponStatus.APPLIED : CouponStatus.GENERATED,
      discountAmount: coupon.discountValue,
      usedBy: coupon.usedBy,
      usedAt: coupon.usedAt,
      createdAt: coupon.createdAt,
    }));

    // Apply status filter
    let filteredCoupons = couponAnalytics;
    if (status !== "all") {
      const filterStatus =
        status === "applied" ? CouponStatus.APPLIED : CouponStatus.GENERATED;
      filteredCoupons = couponAnalytics.filter(
        (coupon) => coupon.status === filterStatus
      );
    }

    // Apply sorting
    filteredCoupons.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "usedAt":
          aValue = a.usedAt || new Date(0);
          bValue = b.usedAt || new Date(0);
          break;
        case "discountAmount":
          aValue = a.discountAmount;
          bValue = b.discountAmount;
          break;
        case "createdAt":
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = filteredCoupons.slice(startIndex, endIndex);

    // Calculate summary statistics
    const appliedCoupons = couponAnalytics.filter(
      (c) => c.status === CouponStatus.APPLIED
    );
    const generatedCoupons = couponAnalytics.filter(
      (c) => c.status === CouponStatus.GENERATED
    );

    res.json({
      message: "Discount codes retrieved successfully",
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredCoupons.length,
        pages: Math.ceil(filteredCoupons.length / limitNum),
      },
      summary: {
        totalCoupons: couponAnalytics.length,
        appliedCoupons: appliedCoupons.length,
        generatedCoupons: generatedCoupons.length,
        usageRate:
          couponAnalytics.length > 0
            ? Math.round((appliedCoupons.length / couponAnalytics.length) * 100)
            : 0,
      },
    });
  })
);

/**
 * GET /api/admin/total-discount
 * Get total discount amount given to users
 */
router.get(
  "/total-discount",
  rateLimiters.admin,
  validate({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
      discountType: Joi.string()
        .valid("all", "coupon", "automatic")
        .default("all"),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, discountType = "all" } = req.query;

    let orders = dataStore.getAllOrders();

    // Filter out cancelled orders
    orders = orders.filter((order) => order.status !== OrderStatus.CANCELLED);

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      orders = orders.filter((order) => order.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      orders = orders.filter((order) => order.createdAt <= end);
    }

    // Calculate different types of discounts
    const ordersWithDiscounts = orders.filter(
      (order) => order.discountAmount > 0
    );

    let couponDiscounts = 0;
    let automaticDiscounts = 0;
    let totalDiscountAmount = 0;

    for (const order of ordersWithDiscounts) {
      totalDiscountAmount += order.discountAmount;

      if (order.discountCode) {
        // Check if it's an automatic nth order discount (contains "SPECIAL" and "ORDER")
        if (
          order.discountCode.includes("SPECIAL") &&
          order.discountCode.includes("ORDER")
        ) {
          automaticDiscounts += order.discountAmount;
        } else {
          couponDiscounts += order.discountAmount;
        }
      }
    }

    // Apply discount type filter
    let filteredDiscountAmount = totalDiscountAmount;
    if (discountType === "coupon") {
      filteredDiscountAmount = couponDiscounts;
    } else if (discountType === "automatic") {
      filteredDiscountAmount = automaticDiscounts;
    }

    const discountData = {
      totalDiscountAmount: Math.round(filteredDiscountAmount * 100) / 100,
      breakdown: {
        couponDiscounts: Math.round(couponDiscounts * 100) / 100,
        automaticDiscounts: Math.round(automaticDiscounts * 100) / 100,
        totalDiscounts: Math.round(totalDiscountAmount * 100) / 100,
      },
      statistics: {
        ordersWithDiscounts: ordersWithDiscounts.length,
        totalOrders: orders.length,
        discountUsageRate:
          orders.length > 0
            ? Math.round((ordersWithDiscounts.length / orders.length) * 100)
            : 0,
        averageDiscountPerOrder:
          ordersWithDiscounts.length > 0
            ? Math.round(
                (totalDiscountAmount / ordersWithDiscounts.length) * 100
              ) / 100
            : 0,
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        discountType,
      },
    };

    res.json({
      message: "Discount analytics retrieved successfully",
      data: discountData,
    });
  })
);

/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard statistics
 */
router.get(
  "/dashboard",
  rateLimiters.admin,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allOrders = dataStore.getAllOrders();
    const completedOrders = allOrders.filter(
      (order) => order.status !== OrderStatus.CANCELLED
    );
    const allCoupons = dataStore.getAllCoupons();
    const allProducts = dataStore.getAllProducts();
    const allUsers = dataStore.getAllUsers();

    // Calculate key metrics
    const totalRevenue = dataStore.getTotalRevenue();
    const totalDiscount = dataStore.getTotalDiscountGiven();
    const totalCouponsGenerated = allCoupons.length;
    const totalCouponsUsed = allCoupons.filter((c) => c.isUsed).length;

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentOrders = completedOrders.filter(
      (order) => order.createdAt > weekAgo
    );
    const recentRevenue = recentOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const recentUsers = allUsers.filter((user) => user.createdAt > weekAgo);

    // Top products
    const purchaseStats = dataStore.getProductPurchaseStats();
    const topProducts = Array.from(purchaseStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        totalQuantity: stats.quantity,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const dashboardStats: AdminStats & {
      recentActivity: {
        ordersLastWeek: number;
        revenueLastWeek: number;
        newUsersLastWeek: number;
      };
      topProducts: Array<{
        productId: string;
        productName: string;
        totalQuantity: number;
        totalRevenue: number;
      }>;
      systemHealth: {
        totalUsers: number;
        totalProducts: number;
        activeProducts: number;
        averageOrderValue: number;
      };
    } = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: completedOrders.length,
      totalDiscountGiven: Math.round(totalDiscount * 100) / 100,
      totalCouponsGenerated,
      totalCouponsUsed,
      recentActivity: {
        ordersLastWeek: recentOrders.length,
        revenueLastWeek: Math.round(recentRevenue * 100) / 100,
        newUsersLastWeek: recentUsers.length,
      },
      topProducts,
      systemHealth: {
        totalUsers: allUsers.length,
        totalProducts: allProducts.length,
        activeProducts: allProducts.filter((p) => p.isActive).length,
        averageOrderValue:
          completedOrders.length > 0
            ? Math.round((totalRevenue / completedOrders.length) * 100) / 100
            : 0,
      },
    };

    res.json({
      message: "Dashboard statistics retrieved successfully",
      data: dashboardStats,
    });
  })
);

/**
 * GET /api/admin/products
 * Get product management data
 */
router.get(
  "/products",
  rateLimiters.admin,
  validate(adminSchemas.pagination),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20 } = req.query;
    const allProducts = dataStore.getAllProducts();
    const purchaseStats = dataStore.getProductPurchaseStats();

    // Add sales data to products
    const productsWithStats = allProducts.map((product) => {
      const stats = purchaseStats.get(product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        sales: {
          totalQuantitySold: stats?.quantity || 0,
          totalRevenue: stats ? Math.round(stats.revenue * 100) / 100 : 0,
        },
      };
    });

    // Sort by total revenue (highest first)
    productsWithStats.sort(
      (a, b) => b.sales.totalRevenue - a.sales.totalRevenue
    );

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = productsWithStats.slice(startIndex, endIndex);

    res.json({
      message: "Product management data retrieved successfully",
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: productsWithStats.length,
        pages: Math.ceil(productsWithStats.length / limitNum),
      },
      summary: {
        totalProducts: allProducts.length,
        activeProducts: allProducts.filter((p) => p.isActive).length,
        totalStock: allProducts.reduce((sum, p) => sum + p.stock, 0),
      },
    });
  })
);

/**
 * GET /api/admin/users
 * Get user analytics and management information
 */
router.get(
  "/users",
  rateLimiters.admin,
  validate(adminSchemas.pagination),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20 } = req.query;

    const allUsers = dataStore.getAllUsers();

    // Prepare user data with order statistics
    const usersWithStats = allUsers.map((user) => {
      const userOrders = dataStore.getOrdersByUserId(user.id);
      const completedOrders = userOrders.filter(
        (order) => order.status !== OrderStatus.CANCELLED
      );
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        statistics: {
          totalOrders: completedOrders.length,
          totalSpent: Math.round(totalSpent * 100) / 100,
          lastOrderDate:
            completedOrders.length > 0
              ? completedOrders.sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                )[0].createdAt
              : null,
        },
      };
    });

    // Sort by total spent (highest first)
    usersWithStats.sort(
      (a, b) => b.statistics.totalSpent - a.statistics.totalSpent
    );

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = usersWithStats.slice(startIndex, endIndex);

    res.json({
      message: "User analytics retrieved successfully",
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: usersWithStats.length,
        pages: Math.ceil(usersWithStats.length / limitNum),
      },
      summary: {
        totalUsers: allUsers.length,
        adminUsers: allUsers.filter((u) => u.isAdmin).length,
        regularUsers: allUsers.filter((u) => !u.isAdmin).length,
      },
    });
  })
);

export default router;
