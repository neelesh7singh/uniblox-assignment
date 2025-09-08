/**
 * Request validation middleware using Joi
 * Provides schema validation for request body, query, and params
 */

import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "./errorHandler";

/**
 * Generic validation middleware factory
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Body: ${detail.message}`)
        );
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Query: ${detail.message}`)
        );
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => `Params: ${detail.message}`)
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: "uuidv4" }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  // Email validation
  email: Joi.string().email().required(),

  // Password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with uppercase, lowercase, and number",
    }),

  // Name validation
  name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),

  // Product price
  price: Joi.number().precision(2).min(0.01).max(999999.99),

  // Quantity validation
  quantity: Joi.number().integer().min(1).max(1000),

  // Product stock
  stock: Joi.number().integer().min(0).max(999999),
};

// Authentication schemas
export const authSchemas = {
  register: {
    body: Joi.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: commonSchemas.name,
      lastName: commonSchemas.name,
    }),
  },

  login: {
    body: Joi.object({
      email: commonSchemas.email,
      password: Joi.string().required(),
    }),
  },
};

// Product schemas
export const productSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(200).required(),
      description: Joi.string().min(10).max(1000).required(),
      price: commonSchemas.price.required(),
      category: Joi.string().min(2).max(50).required(),
      imageUrl: Joi.string().uri().optional(),
      stock: commonSchemas.stock.required(),
    }),
  },

  update: {
    params: Joi.object({
      id: commonSchemas.uuid.required(),
    }),
    body: Joi.object({
      name: Joi.string().min(2).max(200),
      description: Joi.string().min(10).max(1000),
      price: commonSchemas.price,
      category: Joi.string().min(2).max(50),
      imageUrl: Joi.string().uri(),
      stock: commonSchemas.stock,
    }).min(1),
  },

  getById: {
    params: Joi.object({
      id: commonSchemas.uuid.required(),
    }),
  },
};

// Cart schemas
export const cartSchemas = {
  addItem: {
    body: Joi.object({
      productId: commonSchemas.uuid.required(),
      quantity: commonSchemas.quantity.required(),
    }),
  },

  updateItem: {
    params: Joi.object({
      productId: commonSchemas.uuid.required(),
    }),
    body: Joi.object({
      quantity: commonSchemas.quantity.required(),
    }),
  },

  removeItem: {
    params: Joi.object({
      productId: commonSchemas.uuid.required(),
    }),
  },
};

// Order schemas
export const orderSchemas = {
  checkout: {
    body: Joi.object({
      couponCode: Joi.string().min(3).max(20).optional(),
    }),
  },

  getById: {
    params: Joi.object({
      id: commonSchemas.uuid.required(),
    }),
  },

  updateStatus: {
    params: Joi.object({
      id: commonSchemas.uuid.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid("PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED")
        .required(),
    }),
  },
};

// Coupon schemas
export const couponSchemas = {
  generate: {
    body: Joi.object({
      discountType: Joi.string().valid("PERCENTAGE", "FIXED_AMOUNT").required(),
      discountValue: Joi.number()
        .min(0.01)
        .when("discountType", {
          is: "PERCENTAGE",
          then: Joi.number().max(100),
          otherwise: Joi.number().max(999999.99),
        })
        .required(),
      expiresAt: Joi.date().greater("now").optional(),
    }),
  },

  apply: {
    body: Joi.object({
      couponCode: Joi.string().min(3).max(20).required(),
    }),
  },
};

// Admin schemas
export const adminSchemas = {
  pagination: {
    query: commonSchemas.pagination,
  },

  dateRange: {
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
      ...commonSchemas.pagination.describe().keys,
    }),
  },
};

// Utility function to sanitize input data
export const sanitizeInput = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Remove potential XSS attempts and trim whitespace
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Middleware to sanitize request data
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body as Record<string, unknown>);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeInput(req.query as Record<string, unknown>) as any;
  }

  next();
};
