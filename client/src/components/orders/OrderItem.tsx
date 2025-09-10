/**
 * OrderItem Component
 * Displays individual order information in a card format
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, DollarSign, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrderItemProps {
  order: Order;
  showViewButton?: boolean;
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
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * OrderItem component for displaying order information
 */
export const OrderItem: React.FC<OrderItemProps> = ({ order, showViewButton = true }) => {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">{formatDate(order.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(order.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Order Items Preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Items:</h4>
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-sm text-muted-foreground">
                +{order.items.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {showViewButton && (
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to={`/orders/${order.id}`}>
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderItem;
