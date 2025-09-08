/**
 * Authentication middleware for JWT token validation and user authorization
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";
import { DataStore } from "../store/DataStore";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

/**
 * Middleware to verify JWT tokens and authenticate users
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: "Access token required",
      message: "Please provide a valid JWT token in the Authorization header",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verify user still exists in our data store
    const dataStore = DataStore.getInstance();
    const user = dataStore.getUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: "Invalid token",
        message: "User associated with token no longer exists",
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please log in again.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid or malformed",
      });
      return;
    }

    res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during token verification",
    });
  }
};

/**
 * Middleware to verify admin privileges
 * Must be used after authenticateToken middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required",
      message: "User must be authenticated to access admin resources",
    });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({
      error: "Admin access required",
      message: "This resource requires administrator privileges",
    });
    return;
  }

  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (
  userId: string,
  email: string,
  isAdmin: boolean
): string => {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    userId,
    email,
    isAdmin,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h", // Token expires in 24 hours
    issuer: "uniblox-ecommerce",
    audience: "uniblox-users",
  });
};

/**
 * Middleware to handle optional authentication
 * Sets req.user if valid token is provided, but doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const dataStore = DataStore.getInstance();
    const user = dataStore.getUserById(decoded.userId);

    if (user) {
      req.user = decoded;
    }
  } catch (error) {
    // Silently ignore token errors for optional auth
  }

  next();
};
