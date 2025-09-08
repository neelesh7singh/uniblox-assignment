/**
 * Shopping cart routes for managing user's cart items
 * Provides endpoints for adding, updating, removing, and viewing cart items
 */

import { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler, AuthenticationError, BusinessLogicError, NotFoundError } from "../middleware/errorHandler";
import { rateLimiters } from "../middleware/rateLimiter";
import {
  cartSchemas,
  sanitizeRequest,
  validate,
} from "../middleware/validation";
import { DataStore } from "../store/DataStore";
import { AddToCartRequest, CartItem, Product } from "../types";

const router = Router();
const dataStore = DataStore.getInstance();

// All cart routes require authentication
router.use(authenticateToken);

interface CartItemWithProduct extends CartItem {
  product: Product;
  subtotal: number;
}

interface CartWithDetails {
  id: string;
  userId: string;
  items: CartItemWithProduct[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to get cart with product details and calculations
 */
const getCartWithDetails = (userId: string): CartWithDetails | null => {
  const cart = dataStore.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return null;
  }

  const itemsWithDetails: CartItemWithProduct[] = [];
  let totalAmount = 0;
  let totalItems = 0;

  for (const item of cart.items) {
    const product = dataStore.getProductById(item.productId);
    if (product && product.isActive) {
      const subtotal = product.price * item.quantity;
      itemsWithDetails.push({
        ...item,
        product,
        subtotal,
      });
      totalAmount += subtotal;
      totalItems += item.quantity;
    }
  }

  return {
    id: cart.id,
    userId: cart.userId,
    items: itemsWithDetails,
    totalItems,
    totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

/**
 * GET /api/cart
 * Get current user's cart with product details
 */
router.get(
  "/",
  rateLimiters.cart,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const cartWithDetails = getCartWithDetails(req.user.userId);

    if (!cartWithDetails) {
      res.json({
        message: "Cart is empty",
        data: {
          items: [],
          totalItems: 0,
          totalAmount: 0,
          isEmpty: true,
        },
      });
      return;
    }

    res.json({
      message: "Cart retrieved successfully",
      data: {
        ...cartWithDetails,
        isEmpty: false,
      },
    });
  })
);

/**
 * POST /api/cart/add
 * Add item to cart or update quantity if item already exists
 */
router.post(
  "/add",
  rateLimiters.cart,
  sanitizeRequest,
  validate(cartSchemas.addItem),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { productId, quantity } = req.body as AddToCartRequest;

    // Verify product exists and is active
    const product = dataStore.getProductById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Product", productId);
    }

    // Check stock availability
    if (product.stock < quantity) {
      throw new BusinessLogicError(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
      );
    }

    // Get or create cart
    let cart = dataStore.getCartByUserId(req.user.userId);

    if (!cart) {
      cart = {
        id: uuidv4(),
        userId: req.user.userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      // Check total stock availability
      if (product.stock < newQuantity) {
        throw new BusinessLogicError(
          `Insufficient stock. You already have ${existingItem.quantity} in cart. ` +
            `Available: ${product.stock}, Total requested: ${newQuantity}`
        );
      }

      existingItem.quantity = newQuantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId,
        quantity,
        addedAt: new Date(),
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date();
    const updatedCart = dataStore.createOrUpdateCart(cart);

    // Return cart with details
    const cartWithDetails = getCartWithDetails(req.user.userId);

    res.status(201).json({
      message: "Item added to cart successfully",
      data: cartWithDetails,
    });
  })
);

/**
 * PUT /api/cart/:productId
 * Update quantity of specific item in cart
 */
router.put(
  "/:productId",
  rateLimiters.cart,
  sanitizeRequest,
  validate(cartSchemas.updateItem),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    // Verify product exists
    const product = dataStore.getProductById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Product", productId);
    }

    // Get cart
    const cart = dataStore.getCartByUserId(req.user.userId);
    if (!cart) {
      throw new NotFoundError("Cart item", productId);
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );
    if (itemIndex === -1) {
      throw new NotFoundError("Cart item", productId);
    }

    // Check stock availability
    if (product.stock < quantity) {
      throw new BusinessLogicError(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
      );
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();

    dataStore.createOrUpdateCart(cart);

    // Return updated cart
    const cartWithDetails = getCartWithDetails(req.user.userId);

    res.json({
      message: "Cart item updated successfully",
      data: cartWithDetails,
    });
  })
);

/**
 * DELETE /api/cart/:productId
 * Remove specific item from cart
 */
router.delete(
  "/:productId",
  rateLimiters.cart,
  validate(cartSchemas.removeItem),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const { productId } = req.params;

    // Get cart
    const cart = dataStore.getCartByUserId(req.user.userId);
    if (!cart) {
      throw new NotFoundError("Cart item", productId);
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );
    if (itemIndex === -1) {
      throw new NotFoundError("Cart item", productId);
    }

    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date();

    dataStore.createOrUpdateCart(cart);

    // Return updated cart
    const cartWithDetails = getCartWithDetails(req.user.userId);

    res.json({
      message: "Item removed from cart successfully",
      data: cartWithDetails,
    });
  })
);

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete(
  "/",
  rateLimiters.cart,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const deleted = dataStore.clearCart(req.user.userId);

    res.json({
      message: deleted ? "Cart cleared successfully" : "Cart was already empty",
      data: {
        items: [],
        totalItems: 0,
        totalAmount: 0,
        isEmpty: true,
      },
    });
  })
);

/**
 * GET /api/cart/count
 * Get total number of items in cart (for display in UI)
 */
router.get(
  "/count",
  rateLimiters.general,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const cart = dataStore.getCartByUserId(req.user.userId);

    let totalItems = 0;
    if (cart) {
      // Only count items for products that still exist and are active
      for (const item of cart.items) {
        const product = dataStore.getProductById(item.productId);
        if (product && product.isActive) {
          totalItems += item.quantity;
        }
      }
    }

    res.json({
      message: "Cart count retrieved successfully",
      data: {
        totalItems,
      },
    });
  })
);

/**
 * POST /api/cart/validate
 * Validate cart items (check stock availability, product availability, etc.)
 * Useful before checkout to ensure all items are still available
 */
router.post(
  "/validate",
  rateLimiters.cart,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const cart = dataStore.getCartByUserId(req.user.userId);
    if (!cart || cart.items.length === 0) {
      res.json({
        message: "Cart is empty",
        data: {
          isValid: true,
          items: [],
          issues: [],
        },
      });
      return;
    }

    const validItems: CartItemWithProduct[] = [];
    const issues: string[] = [];
    let isValid = true;

    for (const item of cart.items) {
      const product = dataStore.getProductById(item.productId);

      if (!product) {
        issues.push(`Product "${item.productId}" no longer exists`);
        isValid = false;
        continue;
      }

      if (!product.isActive) {
        issues.push(`Product "${product.name}" is no longer available`);
        isValid = false;
        continue;
      }

      if (product.stock < item.quantity) {
        issues.push(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
        isValid = false;
        continue;
      }

      validItems.push({
        ...item,
        product,
        subtotal: product.price * item.quantity,
      });
    }

    res.json({
      message: "Cart validation completed",
      data: {
        isValid,
        items: validItems,
        issues,
        totalValidItems: validItems.length,
        totalAmount: validItems.reduce((sum, item) => sum + item.subtotal, 0),
      },
    });
  })
);

export default router;
