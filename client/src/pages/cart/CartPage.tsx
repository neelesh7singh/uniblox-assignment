/**
 * CartPage Component
 * Main shopping cart page with item management and checkout
 */

import { AlertTriangle, ArrowLeft, Loader2, Package, ShoppingCart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import DiscountNotificationModal from '@/components/cart/DiscountNotificationModal';

import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/services/api';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

/**
 * Main shopping cart page
 */
export const CartPage: React.FC = () => {
  const navigate = useNavigate();

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [availableDiscount, setAvailableDiscount] = useState<any>(null);

  const { cart, fetchCart, validateCart, clearCart, isLoading, error, clearError } = useCartStore();

  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  // Fetch cart on mount
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  // Check for available discounts when cart is loaded
  useEffect(() => {
    if (cart && cart.items.length > 0 && user) {
      checkForAvailableDiscounts();
    }
  }, [cart, user]);

  // Check for available discounts (nth order discount, etc.)
  const checkForAvailableDiscounts = async () => {
    try {
      // Get user's order statistics to check for nth order discount
      const orderStats = await apiClient.getOrderStats();

      console.log('Order Stats:', orderStats);
      console.log('Orders until discount:', orderStats.ordersUntilDiscount);
      console.log('Next discount order:', orderStats.nextDiscountOrder);

      // Check if user is eligible for nth order discount (every 3rd order)
      // If ordersUntilDiscount is 1, their next order will be the discount order
      if (orderStats.ordersUntilDiscount === 1) {
        const discount = {
          code: `ORDER${orderStats.nextDiscountOrder}`,
          percentage: 10,
          orderNumber: orderStats.nextDiscountOrder,
        };

        console.log('Setting available discount:', discount);
        setAvailableDiscount(discount);
        setShowDiscountModal(true);
      } else {
        console.log(
          'User not eligible for discount yet. Orders until discount:',
          orderStats.ordersUntilDiscount
        );
      }
    } catch (error) {
      // Silently fail - discount checking is not critical
      console.log('Could not check for discounts:', error);
    }
  };

  // Handle discount modal acceptance
  const handleAcceptDiscount = () => {
    if (availableDiscount) {
      // Apply the discount as a coupon
      handleApplyCoupon(availableDiscount.code);
      setShowDiscountModal(false);
    }
  };

  // Handle discount modal close
  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false);
    setAvailableDiscount(null);
  };

  // Handle coupon application
  const handleApplyCoupon = async (couponCode: string) => {
    try {
      const result = await apiClient.validateCoupon(couponCode);

      if (result.isValid) {
        setAppliedCoupon({
          code: couponCode,
          discountAmount: result.discountAmount,
          discountType: result.discountType,
        });

        addNotification({
          type: 'success',
          title: 'Coupon Applied',
          message: `${couponCode} applied successfully!`,
          duration: 3000,
        });
      } else {
        throw new Error(result.reason || 'Invalid coupon');
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Coupon Error',
        message: error.response?.data?.error || error.message || 'Failed to apply coupon',
      });
      throw error;
    }
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (!cart || !user) return;

    setCheckoutLoading(true);

    try {
      // Validate cart before checkout
      const validation = await validateCart();

      if (!validation.isValid) {
        setValidationIssues(validation.issues || []);

        addNotification({
          type: 'warning',
          title: 'Cart Issues Found',
          message: 'Please review your cart items before checkout.',
          duration: 5000,
        });

        setCheckoutLoading(false);
        return;
      }

      // Prepare checkout data
      const checkoutData = {
        couponCode: appliedCoupon?.code,
      };

      // Process checkout
      const order = await apiClient.checkout(checkoutData);

      // Clear cart and applied coupon
      clearCart();
      setAppliedCoupon(null);

      addNotification({
        type: 'success',
        title: 'Order Placed Successfully!',
        message: `Order #${order.order.id.slice(-8)} has been placed.`,
        duration: 5000,
      });

      // Navigate to order confirmation or orders page
      navigate(`${ROUTES.ORDERS}/${order.order.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to process checkout';

      addNotification({
        type: 'error',
        title: 'Checkout Failed',
        message: errorMessage,
        duration: 5000,
      });

      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    try {
      await clearCart();
      setAppliedCoupon(null);
      setValidationIssues([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // Handle retry cart fetch
  const handleRetry = () => {
    clearError();
    if (user) {
      fetchCart();
    }
  };

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Please Log In</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view your shopping cart.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={ROUTES.LOGIN}>Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={ROUTES.REGISTER}>Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">Loading your cart...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Cart Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" asChild>
              <Link to={ROUTES.PRODUCTS}>Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Start shopping to add items to your cart and enjoy exclusive discounts!
          </p>
          <Button size="lg" asChild>
            <Link to={ROUTES.PRODUCTS}>
              <Package className="mr-2 h-5 w-5" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link to={ROUTES.PRODUCTS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Cart Issues Found
                </h3>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {validationIssues.map((issue, index) => (
                    <li key={index}>• {issue.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Items ({cart.totalItems})</h2>

            {cart.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                disabled={isLoading}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear Cart
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            {cart.items.map((item) => (
              <CartItem key={item.productId} item={item} disabled={isLoading || checkoutLoading} />
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CartSummary
              cart={cart}
              loading={checkoutLoading}
              onCheckout={handleCheckout}
              onApplyCoupon={handleApplyCoupon}
              appliedCoupon={appliedCoupon}
              availableDiscount={availableDiscount}
            />

            {/* Additional Actions */}
            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to={ROUTES.PRODUCTS}>Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Notification Modal */}
      {availableDiscount && cart && (
        <DiscountNotificationModal
          isOpen={showDiscountModal}
          onClose={handleCloseDiscountModal}
          onAccept={handleAcceptDiscount}
          discount={availableDiscount}
          originalTotal={cart.totalAmount}
          discountedTotal={cart.totalAmount * (1 - availableDiscount.percentage / 100)}
        />
      )}
    </div>
  );
};

export default CartPage;
