/**
 * Application route constants
 * Centralized routing configuration for the application
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PRODUCTS: '/products',
  PRODUCT_DETAILS: '/products/:id',

  // Protected routes
  PROFILE: '/profile',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAILS: '/orders/:id',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];

/**
 * Helper function to generate dynamic routes
 */
export const generateRoute = {
  productDetails: (id: string) => `/products/${id}`,
  orderDetails: (id: string) => `/orders/${id}`,
} as const;

/**
 * Route metadata for navigation and breadcrumbs
 */
export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    title: 'Home',
    breadcrumb: 'Home',
    requiresAuth: false,
    adminOnly: false,
  },
  [ROUTES.LOGIN]: {
    title: 'Login',
    breadcrumb: 'Login',
    requiresAuth: false,
    adminOnly: false,
  },
  [ROUTES.REGISTER]: {
    title: 'Register',
    breadcrumb: 'Register',
    requiresAuth: false,
    adminOnly: false,
  },
  [ROUTES.PRODUCTS]: {
    title: 'Products',
    breadcrumb: 'Products',
    requiresAuth: false,
    adminOnly: false,
  },
  [ROUTES.PROFILE]: {
    title: 'Profile',
    breadcrumb: 'My Profile',
    requiresAuth: true,
    adminOnly: false,
  },
  [ROUTES.CART]: {
    title: 'Shopping Cart',
    breadcrumb: 'Cart',
    requiresAuth: true,
    adminOnly: false,
  },
  [ROUTES.CHECKOUT]: {
    title: 'Checkout',
    breadcrumb: 'Checkout',
    requiresAuth: true,
    adminOnly: false,
  },
  [ROUTES.ORDERS]: {
    title: 'Order History',
    breadcrumb: 'Orders',
    requiresAuth: true,
    adminOnly: false,
  },
  [ROUTES.ADMIN]: {
    title: 'Admin Panel',
    breadcrumb: 'Admin',
    requiresAuth: true,
    adminOnly: true,
  },
} as const;

/**
 * Navigation menu items
 */
export const MAIN_NAVIGATION = [
  {
    title: 'Products',
    href: ROUTES.PRODUCTS,
    description: 'Browse our product catalog',
    requiresAuth: false,
  },
  {
    title: 'Orders',
    href: ROUTES.ORDERS,
    description: 'View your order history',
    requiresAuth: true,
  },
] as const;

export const USER_NAVIGATION = [
  {
    title: 'Profile',
    href: ROUTES.PROFILE,
    description: 'Manage your account',
  },
  {
    title: 'Orders',
    href: ROUTES.ORDERS,
    description: 'View order history',
  },
] as const;

export const ADMIN_NAVIGATION = [
  {
    title: 'Dashboard',
    href: ROUTES.ADMIN_DASHBOARD,
    description: 'Admin overview',
  },
  {
    title: 'Products',
    href: ROUTES.ADMIN_PRODUCTS,
    description: 'Manage products',
  },
  {
    title: 'Orders',
    href: ROUTES.ADMIN_ORDERS,
    description: 'Manage orders',
  },
  {
    title: 'Users',
    href: ROUTES.ADMIN_USERS,
    description: 'Manage users',
  },
  {
    title: 'Analytics',
    href: ROUTES.ADMIN_ANALYTICS,
    description: 'View analytics',
  },
] as const;
