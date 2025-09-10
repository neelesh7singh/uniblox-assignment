/**
 * Authentication routes for user registration, login, and profile management
 * Implements secure authentication with JWT tokens and password hashing
 */

import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken, generateToken } from "../middleware/auth";
import {
  asyncHandler,
  AuthenticationError,
  BusinessLogicError,
} from "../middleware/errorHandler";
import { rateLimiters } from "../middleware/rateLimiter";
import {
  authSchemas,
  sanitizeRequest,
  validate,
} from "../middleware/validation";
import { DataStore } from "../store/DataStore";
import {
  AuthRequest,
  AuthResponse,
  RegisterRequest,
  User,
  UserWithoutPassword,
} from "../types";

const router = Router();
const dataStore = DataStore.getInstance();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post(
  "/register",
  rateLimiters.auth,
  sanitizeRequest,
  validate(authSchemas.register),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName } =
      req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = dataStore.getUserByEmail(email);
    if (existingUser) {
      throw new BusinessLogicError("User with this email already exists");
    }

    // Hash password with salt rounds of 12 for security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save user to data store
    const savedUser = dataStore.addUser(newUser);

    // Generate JWT token
    const token = generateToken(
      savedUser.id,
      savedUser.email,
      savedUser.isAdmin
    );

    // Prepare response (exclude password)
    const userResponse: UserWithoutPassword = {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      isAdmin: savedUser.isAdmin,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };

    const response: AuthResponse = {
      user: userResponse,
      token,
    };

    res.status(201).json({
      message: "User registered successfully",
      data: response,
    });
  })
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  "/login",
  rateLimiters.auth,
  sanitizeRequest,
  validate(authSchemas.login),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as AuthRequest;

    // Find user by email
    const user = dataStore.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.isAdmin);

    // Prepare response (exclude password)
    const userResponse: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response: AuthResponse = {
      user: userResponse,
      token,
    };

    res.json({
      message: "Login successful",
      data: response,
    });
  })
);

/**
 * GET /api/auth/profile
 * Get current user profile (requires authentication)
 */
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // Get fresh user data from store
    const user = dataStore.getUserById(req.user.userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Prepare response (exclude password)
    const userResponse: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: "Profile retrieved successfully",
      data: userResponse,
    });
  })
);

/**
 * PUT /api/auth/profile
 * Update current user profile (requires authentication)
 */
router.put(
  "/profile",
  authenticateToken,
  sanitizeRequest,
  validate({
    body: Joi.object({
      email: Joi.string().email().optional(),
      password: Joi.string()
        .min(8)
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
        .optional()
        .messages({
          "string.pattern.base":
            "Password must contain at least 8 characters with uppercase, lowercase, and number",
        }),
      firstName: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional(),
      lastName: Joi.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional(),
    }).min(1), // At least one field must be provided
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const user = dataStore.getUserById(req.user.userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const { email, firstName, lastName, password } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = dataStore.getUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        throw new BusinessLogicError("Email already in use by another account");
      }
      user.email = email.toLowerCase().trim();
    }

    // Update other fields if provided
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();

    // Update password if provided
    if (password) {
      const saltRounds = 12;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    user.updatedAt = new Date();

    // Save updated user
    dataStore.addUser(user); // This will overwrite the existing user

    // Prepare response (exclude password)
    const userResponse: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: "Profile updated successfully",
      data: userResponse,
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token (extends token expiration)
 */
router.post(
  "/refresh",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // Verify user still exists
    const user = dataStore.getUserById(req.user.userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Generate new token with extended expiration
    const newToken = generateToken(user.id, user.email, user.isAdmin);

    res.json({
      message: "Token refreshed successfully",
      data: {
        token: newToken,
      },
    });
  })
);

export default router;
