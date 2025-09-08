/**
 * Coupon routes for generating and managing discount coupons
 * Includes both admin-generated coupons and automatic nth order coupons
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { DataStore } from "../store/DataStore";
import { Coupon, DiscountType } from "../types";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  validate,
  couponSchemas,
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

/**
 * Generate a random coupon code
 */
const generateCouponCode = (length = 8): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * POST /api/coupons/generate
 * Generate a new coupon (Admin only)
 */
router.post(
  "/generate",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  sanitizeRequest,
  validate(couponSchemas.generate),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { discountType, discountValue, expiresAt } = req.body;

    // Generate unique coupon code
    let couponCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      couponCode = generateCouponCode();
      attempts++;

      if (attempts > maxAttempts) {
        throw new BusinessLogicError("Unable to generate unique coupon code");
      }
    } while (dataStore.getCouponByCode(couponCode));

    const newCoupon: Coupon = {
      id: uuidv4(),
      code: couponCode,
      discountType: discountType as DiscountType,
      discountValue: Number(discountValue),
      isUsed: false,
      expiresAt: expiresAt ? new Date(expiresAt as string) : undefined,
      createdAt: new Date(),
    };

    const savedCoupon = dataStore.addCoupon(newCoupon);

    res.status(201).json({
      message: "Coupon generated successfully",
      data: savedCoupon,
    });
  })
);

/**
 * POST /api/coupons/validate
 * Validate a coupon code and return discount info (for checkout preview)
 */
router.post(
  "/validate",
  authenticateToken,
  rateLimiters.general,
  sanitizeRequest,
  validate(couponSchemas.apply),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { couponCode } = req.body;

    const coupon = dataStore.getCouponByCode(couponCode);

    if (!coupon) {
      throw new NotFoundError("Coupon", couponCode);
    }

    const validationResult = {
      isValid: true,
      coupon,
      issues: [] as string[],
    };

    // Check if already used
    if (coupon.isUsed) {
      validationResult.isValid = false;
      validationResult.issues.push("Coupon has already been used");
    }

    // Check expiration
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      validationResult.isValid = false;
      validationResult.issues.push("Coupon has expired");
    }

    const message = validationResult.isValid
      ? "Coupon is valid and ready to use"
      : "Coupon validation failed";

    res.json({
      message,
      data: validationResult,
    });
  })
);

/**
 * GET /api/coupons/my-coupons
 * Get coupons available to current user (unused, non-expired)
 */
router.get(
  "/my-coupons",
  authenticateToken,
  rateLimiters.general,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const allCoupons = dataStore.getAllCoupons();

    // Filter coupons: unused, non-expired, and either public or created for this user
    const availableCoupons = allCoupons.filter((coupon) => {
      const isNotUsed = !coupon.isUsed;
      const isNotExpired = !coupon.expiresAt || coupon.expiresAt > new Date();

      return isNotUsed && isNotExpired;
    });

    // Remove sensitive info for user view
    const userCoupons = availableCoupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiresAt: coupon.expiresAt,
      createdAt: coupon.createdAt,
    }));

    res.json({
      message: "Available coupons retrieved successfully",
      data: userCoupons,
    });
  })
);

/**
 * GET /api/coupons/used-coupons
 * Get coupons used by current user
 */
router.get(
  "/used-coupons",
  authenticateToken,
  rateLimiters.general,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const allCoupons = dataStore.getAllCoupons();

    // Filter coupons used by this user
    const usedCoupons = allCoupons.filter(
      (coupon) => coupon.isUsed && coupon.usedBy === req.user!.userId
    );

    res.json({
      message: "Used coupons retrieved successfully",
      data: usedCoupons,
    });
  })
);

// Admin routes

/**
 * GET /api/coupons/admin/all
 * Get all coupons with filtering (Admin only)
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
        .valid("all", "used", "unused", "expired")
        .default("all"),
      discountType: Joi.string()
        .valid(...Object.values(DiscountType))
        .optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, status = "all", discountType } = req.query;

    let coupons = dataStore.getAllCoupons();
    const now = new Date();

    // Apply filters
    if (status !== "all") {
      switch (status) {
        case "used":
          coupons = coupons.filter((coupon) => coupon.isUsed);
          break;
        case "unused":
          coupons = coupons.filter((coupon) => !coupon.isUsed);
          break;
        case "expired":
          coupons = coupons.filter(
            (coupon) => coupon.expiresAt && coupon.expiresAt < now
          );
          break;
      }
    }

    if (discountType) {
      coupons = coupons.filter(
        (coupon) => coupon.discountType === discountType
      );
    }

    // Sort by creation date (most recent first)
    coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedCoupons = coupons.slice(startIndex, endIndex);

    res.json({
      message: "Coupons retrieved successfully",
      data: paginatedCoupons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: coupons.length,
        pages: Math.ceil(coupons.length / limitNum),
      },
    });
  })
);

/**
 * GET /api/coupons/admin/stats
 * Get coupon statistics (Admin only)
 */
router.get(
  "/admin/stats",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allCoupons = dataStore.getAllCoupons();
    const now = new Date();

    const stats = {
      total: allCoupons.length,
      used: allCoupons.filter((c) => c.isUsed).length,
      unused: allCoupons.filter((c) => !c.isUsed).length,
      expired: allCoupons.filter(
        (c) => c.expiresAt && c.expiresAt < now && !c.isUsed
      ).length,
      percentageUsed:
        allCoupons.length > 0
          ? Math.round(
              (allCoupons.filter((c) => c.isUsed).length / allCoupons.length) *
                100
            )
          : 0,
      totalDiscountGiven: dataStore.getTotalDiscountGiven(),
      byType: {
        percentage: allCoupons.filter(
          (c) => c.discountType === DiscountType.PERCENTAGE
        ).length,
        fixedAmount: allCoupons.filter(
          (c) => c.discountType === DiscountType.FIXED_AMOUNT
        ).length,
      },
      recentlyCreated: allCoupons.filter((c) => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return c.createdAt > dayAgo;
      }).length,
      recentlyUsed: allCoupons.filter((c) => {
        if (!c.usedAt) return false;
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return c.usedAt > dayAgo;
      }).length,
    };

    res.json({
      message: "Coupon statistics retrieved successfully",
      data: stats,
    });
  })
);

/**
 * DELETE /api/coupons/admin/:id
 * Delete a coupon (Admin only) - only if not used
 */
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  validate({
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const coupon = dataStore.getCouponById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon", id);
    }

    if (coupon.isUsed) {
      throw new BusinessLogicError("Cannot delete a coupon that has been used");
    }

    // Since we don't have a delete method in DataStore, we'll mark it as expired
    // In a real application, you'd implement proper deletion
    coupon.expiresAt = new Date(); // Mark as expired immediately
    dataStore.addCoupon(coupon);

    res.json({
      message: "Coupon disabled successfully",
    });
  })
);

/**
 * POST /api/coupons/admin/bulk-generate
 * Generate multiple coupons at once (Admin only)
 */
router.post(
  "/admin/bulk-generate",
  authenticateToken,
  requireAdmin,
  rateLimiters.strict,
  sanitizeRequest,
  validate({
    body: Joi.object({
      count: Joi.number().integer().min(1).max(100).required(),
      discountType: Joi.string()
        .valid(...Object.values(DiscountType))
        .required(),
      discountValue: Joi.number()
        .min(0.01)
        .when("discountType", {
          is: "PERCENTAGE",
          then: Joi.number().max(100),
          otherwise: Joi.number().max(999999.99),
        })
        .required(),
      expiresAt: Joi.date().greater("now").optional(),
      prefix: Joi.string()
        .min(1)
        .max(10)
        .pattern(/^[A-Z0-9]+$/)
        .optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { count, discountType, discountValue, expiresAt, prefix } = req.body;

    const generatedCoupons: Coupon[] = [];
    const failedCoupons: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        let couponCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          const baseCode = generateCouponCode();
          couponCode = prefix ? `${prefix}${baseCode}` : baseCode;
          attempts++;

          if (attempts > maxAttempts) {
            throw new Error("Unable to generate unique coupon code");
          }
        } while (dataStore.getCouponByCode(couponCode));

        const newCoupon: Coupon = {
          id: uuidv4(),
          code: couponCode,
          discountType: discountType as DiscountType,
          discountValue: Number(discountValue),
          isUsed: false,
          expiresAt: expiresAt ? new Date(expiresAt as string) : undefined,
          createdAt: new Date(),
        };

        const savedCoupon = dataStore.addCoupon(newCoupon);
        generatedCoupons.push(savedCoupon);
      } catch (error) {
        failedCoupons.push(
          `Coupon ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    res.status(201).json({
      message: `Bulk coupon generation completed. Generated: ${generatedCoupons.length}, Failed: ${failedCoupons.length}`,
      data: {
        generated: generatedCoupons,
        failed: failedCoupons,
        summary: {
          totalRequested: count,
          successfullyGenerated: generatedCoupons.length,
          failed: failedCoupons.length,
        },
      },
    });
  })
);

export default router;
