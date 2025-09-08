/**
 * Rate limiting middleware to prevent abuse and ensure fair usage
 * Implements sliding window rate limiting with different limits for different endpoints
 */

import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "./errorHandler";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit tracking
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimitStore {
  private store = new Map<string, RequestRecord>();

  /**
   * Increment request count for a key
   */
  public increment(
    key: string,
    windowMs: number
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;

    const existing = this.store.get(key);

    if (!existing || existing.resetTime <= now) {
      // Create new record or reset expired record
      const record = { count: 1, resetTime };
      this.store.set(key, record);
      return record;
    }

    // Increment existing record
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  /**
   * Get current count for a key
   */
  public get(key: string): RequestRecord | undefined {
    const record = this.store.get(key);
    if (record && record.resetTime > Date.now()) {
      return record;
    }
    // Clean up expired record
    if (record) {
      this.store.delete(key);
    }
    return undefined;
  }

  /**
   * Clean up expired records (should be called periodically)
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get store size (for monitoring)
   */
  public size(): number {
    return this.store.size;
  }

  /**
   * Clear all records (for testing)
   */
  public clear(): void {
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// Cleanup expired records every 5 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 5 * 60 * 1000);

/**
 * Generate rate limit key for a request
 */
const generateKey = (req: Request, identifier?: string): string => {
  if (identifier) {
    return identifier;
  }

  // Use user ID if authenticated, otherwise use IP
  const userId = req.user?.userId;
  const ip = req.ip || req.connection.remoteAddress || "unknown";

  return userId ? `user:${userId}` : `ip:${ip}`;
};

/**
 * Create rate limiting middleware
 */
export const createRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = generateKey(req);
    const record = rateLimitStore.increment(key, config.windowMs);

    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": config.maxRequests.toString(),
      "X-RateLimit-Remaining": Math.max(
        0,
        config.maxRequests - record.count
      ).toString(),
      "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString(),
    });

    if (record.count > config.maxRequests) {
      res.set(
        "Retry-After",
        Math.ceil((record.resetTime - Date.now()) / 1000).toString()
      );
      throw new RateLimitError(
        config.message || "Too many requests, please try again later."
      );
    }

    next();
  };
};

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === "test" ? 10000 : 1000, // Much higher limit for tests
    message: "Too many requests from this IP, please try again later.",
  }),

  // Authentication rate limit (more restrictive)
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === "test" ? 1000 : 10, // Much higher limit for tests
    message: "Too many authentication attempts, please try again later.",
  }),

  // Strict rate limit for sensitive operations
  strict: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: process.env.NODE_ENV === "test" ? 500 : 5, // Much higher limit for tests
    message: "Rate limit exceeded for this operation.",
  }),

  // Cart operations (moderate limit)
  cart: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: process.env.NODE_ENV === "test" ? 5000 : 100, // Much higher limit for tests
    message: "Too many cart operations, please slow down.",
  }),

  // Admin operations (more lenient for admins)
  admin: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: process.env.NODE_ENV === "test" ? 10000 : 500, // Much higher limit for tests
    message: "Admin rate limit exceeded.",
  }),
};

/**
 * Middleware to apply different rate limits based on user type
 */
export const adaptiveRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Apply more lenient rate limiting for authenticated admin users
  if (req.user?.isAdmin) {
    rateLimiters.admin(req, res, next);
  } else {
    rateLimiters.general(req, res, next);
  }
};

// /**
//  * Get rate limit status for a key (useful for monitoring)
//  */
// export const getRateLimitStatus = (
//   key: string
// ): {
//   count: number;
//   resetTime: number;
//   remaining: number;
// } | null => {
//   const record = rateLimitStore.get(key);
//   if (!record) {
//     return null;
//   }

//   return {
//     count: record.count,
//     resetTime: record.resetTime,
//     remaining: Math.max(0, 1000 - record.count), // Assuming general limit
//   };
// };

// /**
//  * Reset rate limit for a specific key (useful for testing or admin override)
//  */
// export const resetRateLimit = (key: string): boolean => {
//   return rateLimitStore["store"].delete(key);
// };

// /**
//  * Get rate limiter statistics (for monitoring)
//  */
// export const getRateLimitStats = (): {
//   totalKeys: number;
//   storeSize: number;
// } => {
//   return {
//     totalKeys: rateLimitStore.size(),
//     storeSize: rateLimitStore.size(),
//   };
// };
