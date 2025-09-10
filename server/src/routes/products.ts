/**
 * Product routes for listing and managing products
 * Provides endpoints for retrieving product information
 */

import { Request, Response, Router } from "express";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
import {
  authenticateToken,
  optionalAuth,
  requireAdmin,
} from "../middleware/auth";
import {
  asyncHandler,
  BusinessLogicError,
  NotFoundError,
} from "../middleware/errorHandler";
import { rateLimiters } from "../middleware/rateLimiter";
import {
  productSchemas,
  sanitizeRequest,
  validate,
} from "../middleware/validation";
import { DataStore } from "../store/DataStore";
import { CreateProductRequest, PaginatedResponse, Product } from "../types";

const router = Router();
const dataStore = DataStore.getInstance();

/**
 * GET /api/products
 * Get all active products with optional filtering and pagination
 */
router.get(
  "/",
  rateLimiters.general,
  optionalAuth, // Optional authentication to potentially show personalized content
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50),
      category: Joi.string().min(2).max(50).optional(),
      search: Joi.string().min(1).max(200).optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      sortBy: Joi.string()
        .valid("name", "price", "createdAt", "stock")
        .default("createdAt"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let products = dataStore.getAllProducts();

    // Apply filters
    if (category) {
      products = products.filter(
        (product) =>
          product.category.toLowerCase() === (category as string).toLowerCase()
      );
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    if (minPrice !== undefined) {
      products = products.filter(
        (product) => product.price >= Number(minPrice)
      );
    }

    if (maxPrice !== undefined) {
      products = products.filter(
        (product) => product.price <= Number(maxPrice)
      );
    }

    // Apply sorting
    products.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "stock":
          aValue = a.stock;
          bValue = b.stock;
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
    const paginatedProducts = products.slice(startIndex, endIndex);

    const response: PaginatedResponse<Product> = {
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: products.length,
        pages: Math.ceil(products.length / limitNum),
      },
    };

    res.json({
      message: "Products retrieved successfully",
      ...response,
    });
  })
);

/**
 * GET /api/products/:id
 * Get a specific product by ID
 */
router.get(
  "/:id",
  rateLimiters.general,
  optionalAuth,
  validate(productSchemas.getById),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const product = dataStore.getProductById(id);
    if (!product) {
      throw new NotFoundError("Product", id);
    }

    if (!product.isActive) {
      throw new NotFoundError("Product", id);
    }

    res.json({
      message: "Product retrieved successfully",
      data: product,
    });
  })
);

/**
 * GET /api/products/categories
 * Get all available product categories
 */
router.get(
  "/meta/categories",
  rateLimiters.general,
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const products = dataStore.getAllProducts();
    const categories = [
      ...new Set(products.map((product) => product.category)),
    ];

    res.json({
      message: "Categories retrieved successfully",
      data: categories.sort(),
    });
  })
);

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  sanitizeRequest,
  validate(productSchemas.create),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const productData = req.body as CreateProductRequest;

    // Check if product with same name already exists
    const existingProducts = dataStore.getAllProducts();
    const duplicateName = existingProducts.find(
      (p) => p.name.toLowerCase() === productData.name.toLowerCase()
    );

    if (duplicateName) {
      throw new BusinessLogicError("Product with this name already exists");
    }

    const newProduct: Product = {
      id: uuidv4(),
      ...productData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedProduct = dataStore.addProduct(newProduct);

    res.status(201).json({
      message: "Product created successfully",
      data: savedProduct,
    });
  })
);

/**
 * PUT /api/products/:id
 * Update an existing product (Admin only)
 */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  sanitizeRequest,
  validate(productSchemas.update),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    const product = dataStore.getProductById(id);
    if (!product) {
      throw new NotFoundError("Product", id);
    }

    // Check for duplicate name if name is being updated
    if (updateData.name && updateData.name !== product.name) {
      const existingProducts = dataStore.getAllProducts();
      const duplicateName = existingProducts.find(
        (p) =>
          p.id !== id && p.name.toLowerCase() === updateData.name.toLowerCase()
      );

      if (duplicateName) {
        throw new BusinessLogicError("Product with this name already exists");
      }
    }

    // Update product fields
    Object.assign(product, updateData, { updatedAt: new Date() });

    const updatedProduct = dataStore.addProduct(product); // This will overwrite

    res.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  })
);

/**
 * DELETE /api/products/:id
 * Soft delete a product (mark as inactive) (Admin only)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  rateLimiters.admin,
  validate(productSchemas.getById),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const product = dataStore.getProductById(id);
    if (!product) {
      throw new NotFoundError("Product", id);
    }

    // Soft delete by marking as inactive
    product.isActive = false;
    product.updatedAt = new Date();

    dataStore.addProduct(product);

    res.json({
      message: "Product deleted successfully",
    });
  })
);

/**
 * GET /api/products/search/suggestions
 * Get search suggestions based on partial input
 */
router.get(
  "/search/suggestions",
  rateLimiters.general,
  optionalAuth,
  validate({
    query: Joi.object({
      q: Joi.string().min(1).max(100).required(),
      limit: Joi.number().integer().min(1).max(10).default(5),
    }),
  }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q, limit = 5 } = req.query;
    const searchTerm = (q as string).toLowerCase();

    const products = dataStore.getAllProducts();
    const suggestions = products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, Number(limit))
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      }));

    res.json({
      message: "Search suggestions retrieved successfully",
      data: suggestions,
    });
  })
);

export default router;
