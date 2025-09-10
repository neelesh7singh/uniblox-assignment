/**
 * OrderStats Component
 * Displays user's order statistics and summary
 */

import React from 'react';
import { Package, DollarSign, TrendingUp, Gift } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { formatCurrency } from '@/lib/utils';

interface OrderStatsProps {
  stats: {
    totalOrders: number;
    totalSpent: number;
    ordersUntilDiscount: number;
  };
  loading?: boolean;
}

/**
 * OrderStats component for displaying user order statistics
 */
export const OrderStats: React.FC<OrderStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isEligibleForDiscount = stats.ordersUntilDiscount === 0;
  const nextDiscountIn = stats.ordersUntilDiscount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalOrders === 1 ? 'order placed' : 'orders placed'}
          </p>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalOrders > 0
              ? `Avg: ${formatCurrency(stats.totalSpent / stats.totalOrders)}`
              : 'No orders yet'}
          </p>
        </CardContent>
      </Card>

      {/* Orders Until Discount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Discount</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isEligibleForDiscount ? 'Ready!' : nextDiscountIn}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEligibleForDiscount
              ? '10% off next order'
              : `${nextDiscountIn} more order${nextDiscountIn === 1 ? '' : 's'} needed`}
          </p>
        </CardContent>
      </Card>

      {/* Discount Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Discount Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={isEligibleForDiscount ? 'default' : 'secondary'}>
              {isEligibleForDiscount ? 'Available' : 'In Progress'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isEligibleForDiscount
              ? 'You qualify for 10% discount'
              : 'Every 3rd order gets 10% off'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStats;
