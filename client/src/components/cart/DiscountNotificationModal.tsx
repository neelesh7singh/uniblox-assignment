/**
 * DiscountNotificationModal Component
 * Shows a modal when user is eligible for nth order discount
 */

import React from 'react';
import { Gift, X, CheckCircle, Percent } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface DiscountNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  discount: {
    code: string;
    percentage: number;
    orderNumber: number;
  };
  originalTotal: number;
  discountedTotal: number;
}

/**
 * DiscountNotificationModal component for showing nth order discount
 */
export const DiscountNotificationModal: React.FC<DiscountNotificationModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  discount,
  originalTotal,
  discountedTotal,
}) => {
  const savings = originalTotal - discountedTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-green-600" />
            Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discount Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 text-lg">
              {discount.percentage}% OFF
            </Badge>
          </div>

          {/* Discount Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              You've earned a special discount!
            </p>
            <p className="text-sm text-muted-foreground">
              This is your{' '}
              <span className="font-semibold text-primary">{discount.orderNumber}rd order</span> -
              you get{' '}
              <span className="font-semibold text-green-600">{discount.percentage}% off</span>{' '}
              automatically!
            </p>
          </div>

          {/* Price Comparison */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Original Total:</span>
              <span className="text-sm line-through text-muted-foreground">
                {formatCurrency(originalTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Discount ({discount.percentage}%):
              </span>
              <span className="text-sm text-green-600 font-semibold">
                -{formatCurrency(savings)}
              </span>
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">New Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(discountedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Code */}
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your discount code:</p>
            <p className="font-mono font-semibold text-primary text-lg">{discount.code}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This discount will be applied automatically at checkout
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={onAccept} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Apply Discount
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 This discount is automatically applied to your order. No need to enter any codes!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountNotificationModal;
