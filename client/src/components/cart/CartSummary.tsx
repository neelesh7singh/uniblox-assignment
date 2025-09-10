/**
 * CartSummary Component
 * Displays cart totals, discounts, and checkout information
 */

import React, { useState } from 'react';
import { ShoppingBag, CreditCard, Tag, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { formatCurrency } from '@/lib/utils';
import type { Cart } from '@/types';

interface CartSummaryProps {
  cart: Cart | null;
  loading?: boolean;
  onCheckout?: () => void;
  onApplyCoupon?: (code: string) => Promise<any>;
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  };
  availableDiscount?: {
    code: string;
    percentage: number;
    orderNumber: number;
  };
  className?: string;
}

/**
 * Cart summary with totals and checkout functionality
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  loading = false,
  onCheckout,
  onApplyCoupon,
  appliedCoupon,
  availableDiscount,
  className = '',
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculate totals (matching backend calculation)
  const subtotal = cart?.totalAmount || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Additional costs (for display only, not included in order total)
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const tax = (subtotal - discountAmount) * 0.08; // 8% tax
  const totalWithShippingAndTax = total + shipping + tax;

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error: any) {
      setCouponError(error.response?.data?.error || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (onCheckout && !loading) {
      onCheckout();
    }
  };

  const itemCount = cart?.totalItems || 0;
  const isEmpty = itemCount === 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Items Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items ({itemCount})</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Available Discount Notification */}
        {availableDiscount && !appliedCoupon && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Special Discount Available!
              </span>
            </div>
            <p className="text-xs text-green-700 mb-2">
              You're eligible for {availableDiscount.percentage}% off on your{' '}
              {availableDiscount.orderNumber}rd order!
            </p>
            <div className="text-xs text-green-600">
              <span className="line-through">{formatCurrency(subtotal)}</span>
              <span className="ml-2 font-semibold">
                {formatCurrency(subtotal * (1 - availableDiscount.percentage / 100))}
              </span>
            </div>
          </div>
        )}

        {/* Coupon Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponLoading || loading}
                className="text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || couponLoading || loading}
            >
              {couponLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Applied Coupon */}
          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {appliedCoupon.code}
                </Badge>
                <span className="text-muted-foreground">Discount</span>
              </div>
              <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {/* Coupon Error */}
          {couponError && <p className="text-sm text-destructive">{couponError}</p>}
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {availableDiscount && !appliedCoupon && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Available Discount</span>
                <Badge variant="secondary" className="text-xs">
                  {availableDiscount.percentage}% OFF
                </Badge>
              </div>
              <span className="text-green-600">
                -{formatCurrency(subtotal * (availableDiscount.percentage / 100))}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Shipping
              {shipping === 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  FREE
                </Badge>
              )}
            </span>
            <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Free Shipping Hint */}
        {subtotal > 0 && subtotal < 50 && (
          <div className="text-sm text-center p-3 bg-muted rounded-md">
            <p className="text-muted-foreground">
              Add {formatCurrency(50 - subtotal)} more for free shipping! 🚚
            </p>
          </div>
        )}

        {/* Checkout Button */}
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isEmpty || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              <div className="flex flex-col items-center">
                <span>Proceed to Checkout</span>
                {availableDiscount && !appliedCoupon ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="line-through text-muted-foreground">
                      {formatCurrency(subtotal)}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(subtotal * (1 - availableDiscount.percentage / 100))}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {availableDiscount.percentage}% OFF
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm font-medium">{formatCurrency(total)}</span>
                )}
              </div>
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-center text-muted-foreground">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>

        {/* Benefits List */}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <span>Free returns within 30 days</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <span>Secure payment processing</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <span>24/7 customer support</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;
