/**
 * Main Express application entry point
 * Sets up middleware, routes, and starts the server
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { DataStore } from "./store/DataStore";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { rateLimiters } from "./middleware/rateLimiter";

// Import routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import couponRoutes from "./routes/coupons";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize data store
const dataStore = DataStore.getInstance();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow for development
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"] // Replace with actual frontend URL
        : ["http://localhost:3000"], // Development origins (client on 3000)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// General middleware
app.use(compression()); // Compress responses
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting middleware (applied globally)
app.use(rateLimiters.general);

// Health check endpoint
app.get("/health", (req, res) => {
  const stats = dataStore.getStats();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dataStore: stats,
    version: "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Uniblox E-commerce API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api/docs",
    health: "/health",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      coupons: "/api/coupons",
      admin: "/api/admin",
    },
  });
});

// API documentation endpoint
app.get("/api/docs", (req, res) => {
  res.json({
    title: "Uniblox E-commerce API Documentation",
    version: "1.0.0",
    description:
      "RESTful API for e-commerce operations with user authentication, cart management, order processing, and admin analytics",
    baseUrl: `${req.protocol}://${req.get("host")}/api`,
    endpoints: {
      authentication: {
        "POST /auth/register": "Register a new user account",
        "POST /auth/login": "Login with email and password",
        "GET /auth/profile": "Get current user profile",
        "PUT /auth/profile": "Update user profile",
        "POST /auth/refresh": "Refresh JWT token",
      },
      products: {
        "GET /products": "List all products with filtering and pagination",
        "GET /products/:id": "Get specific product details",
        "GET /products/meta/categories": "Get all product categories",
        "GET /products/search/suggestions": "Get search suggestions",
        "POST /products": "Create new product (Admin)",
        "PUT /products/:id": "Update product (Admin)",
        "DELETE /products/:id": "Delete product (Admin)",
      },
      cart: {
        "GET /cart": "Get current user cart",
        "POST /cart/add": "Add item to cart",
        "PUT /cart/:productId": "Update cart item quantity",
        "DELETE /cart/:productId": "Remove item from cart",
        "DELETE /cart": "Clear entire cart",
        "POST /cart/validate": "Validate cart items",
      },
      orders: {
        "POST /orders/checkout": "Process checkout and create order",
        "GET /orders/history": "Get user order history",
        "GET /orders/:id": "Get specific order details",
        "GET /orders/stats/summary": "Get user order statistics",
        "PUT /orders/:id/cancel": "Cancel order",
      },
      coupons: {
        "POST /coupons/validate": "Validate coupon code",
        "POST /coupons/generate": "Generate new coupon (Admin)",
        "GET /coupons/admin/all": "Get all coupons (Admin)",
      },
      admin: {
        "GET /admin/purchases": "Get purchase analytics",
        "GET /admin/total-revenue": "Get total revenue data",
        "GET /admin/discount-codes": "Get discount code analytics",
        "GET /admin/total-discount": "Get total discount amount",
        "GET /admin/dashboard": "Get dashboard statistics",
        "GET /admin/users": "Get user analytics",
        "GET /admin/products": "Get product management data",
        "GET /orders/admin/all": "Get all orders (Admin)",
        "PUT /orders/admin/:id/status": "Update order status (Admin)",
      },
    },
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Uniblox E-commerce Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 Data Store Stats:`, dataStore.getStats());
  });

  // Handle server errors
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    switch (error.code) {
      case "EACCES":
        console.error(`Port ${PORT} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

export default app;
