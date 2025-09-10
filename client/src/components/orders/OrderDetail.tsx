/**
 * OrderDetail Component
 * Displays detailed information about a specific order
 */

import React from 'react';
import { ArrowLeft, Package, Calendar, DollarSign, Tag, Truck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrderDetailProps {
  order: Order;
  onBack?: () => void;
}

/**
 * Get status badge variant based on order status
 */
const getStatusVariant = (
  status: OrderStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'outline';
    case 'CONFIRMED':
      return 'default';
    case 'SHIPPED':
      return 'secondary';
    case 'DELIVERED':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

/**
 * Get status display text
 */
const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

/**
 * Get status icon based on order status
 */
const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return <Package className="h-4 w-4" />;
    case 'CONFIRMED':
      return <Package className="h-4 w-4" />;
    case 'SHIPPED':
      return <Truck className="h-4 w-4" />;
    case 'DELIVERED':
      return <Package className="h-4 w-4" />;
    case 'CANCELLED':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * OrderDetail component for displaying detailed order information
 */
export const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack }) => {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(-8)}</h1>
            <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          {getStatusText(order.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({itemCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.productPrice)} each</p>
                    <p className="text-sm text-muted-foreground">
                      Subtotal: {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono text-sm">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={getStatusVariant(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-green-600">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                  {order.discountCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {order.discountCode}
                      </Badge>
                    </div>
                  )}
                </>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
