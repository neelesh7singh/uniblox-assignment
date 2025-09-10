/**
 * Main App Component
 * Entry point for the Uniblox E-commerce React application with routing
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Components
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import ProductsPage from '@/pages/products/ProductsPage';
import ProductDetailPage from '@/pages/products/ProductDetailPage';
import CartPage from '@/pages/cart/CartPage';
import OrderHistoryPage from '@/pages/orders/OrderHistoryPage';
import OrderDetailPage from '@/pages/orders/OrderDetailPage';
import UsersPage from '@/pages/admin/UsersPage';
import AdminProductsPage from '@/pages/admin/ProductsPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import AdminLayout from '@/components/admin/AdminLayout';
import NotFoundPage from '@/pages/NotFoundPage';

// Stores
import { useAuthStore } from '@/store/auth';
import { initializeTheme } from '@/store/app';

// Constants
import { ROUTES } from '@/constants/routes';

// Styles
import './index.css';

const App: React.FC = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    // Initialize theme system
    const cleanupTheme = initializeTheme();

    // Check authentication status on app load
    checkAuthStatus();

    // Cleanup function
    return () => {
      cleanupTheme?.();
    };
  }, [checkAuthStatus]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public Routes with Layout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />

              {/* Protected Routes */}
              <Route
                path={ROUTES.PROFILE}
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Product Routes */}
              <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />

              {/* Cart Route - Protected */}
              <Route
                path={ROUTES.CART}
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />

              {/* Order Routes - Protected */}
              <Route
                path={ROUTES.ORDERS}
                element={
                  <ProtectedRoute>
                    <OrderHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<UsersPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Authentication Routes (No Layout) */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster position="top-right" expand={false} richColors closeButton />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
