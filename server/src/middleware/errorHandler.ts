/**
 * Centralized error handling middleware for the application
 * Provides consistent error responses and logging
 */

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../types";

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements ApiError {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't handle if response was already sent
  if (res.headersSent) {
    next(error);
    return;
  }

  // Log error for debugging
  console.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Handle known AppError instances
  if (error instanceof AppError) {
    const responseBody: any = {
      error: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    if (error.details) {
      responseBody.details = error.details;
    }

    res.status(error.statusCode).json(responseBody);
    return;
  }

  // Handle validation errors (from Joi or similar)
  if (error.name === "ValidationError") {
    res.status(400).json({
      error: "Validation failed",
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle JWT errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    res.status(401).json({
      error: "Authentication error",
      message: "Invalid or expired token",
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: "Invalid JSON",
      message: "Request body contains invalid JSON",
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  // Default error response for unhandled errors
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

/**
 * Async error wrapper utility
 * Wraps async route handlers to automatically catch and forward errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

/**
 * Validation error for request data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Business logic error (like insufficient stock, invalid operation)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "BusinessLogicError";
  }
}
