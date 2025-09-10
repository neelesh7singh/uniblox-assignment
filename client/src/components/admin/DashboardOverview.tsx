/**
 * DashboardOverview Component
 * Displays key metrics and analytics overview
 */

import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  Gift,
} from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { formatCurrency } from '@/lib/utils';
import AnalyticsCard from './AnalyticsCard';

import type { PurchaseAnalyticsSummary } from '@/types';

interface DashboardOverviewProps {
  purchaseAnalytics: PurchaseAnalyticsSummary | null;
  dashboardStats: any | null;
  loading: boolean;
}

/**
 * DashboardOverview component for displaying key metrics
 */
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  purchaseAnalytics,
  dashboardStats,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Revenue"
          value={purchaseAnalytics?.totalRevenue || 0}
          subtitle="All time revenue"
          icon={DollarSign}
          format="currency"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Orders"
          value={dashboardStats?.totalOrders || 0}
          subtitle="Orders placed"
          icon={ShoppingCart}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Users"
          value={dashboardStats?.systemHealth?.totalUsers || 0}
          subtitle="Registered users"
          icon={Users}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Average Order Value"
          value={purchaseAnalytics?.averageOrderValue || 0}
          subtitle="Per order"
          icon={TrendingUp}
          format="currency"
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Discount Given"
          value={purchaseAnalytics?.totalDiscountAmount || 0}
          subtitle="Total savings"
          icon={DollarSign}
          format="currency"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Products"
          value={dashboardStats?.systemHealth?.totalProducts || 0}
          subtitle="Available products"
          icon={Package}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Coupons"
          value={dashboardStats?.totalCouponsGenerated || 0}
          subtitle="Generated"
          icon={Gift}
          format="number"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {purchaseAnalytics?.topSellingProducts?.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.quantitySold} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(purchaseAnalytics?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Order Value</span>
                  <span className="font-medium">
                    {formatCurrency(purchaseAnalytics?.averageOrderValue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Discount Given</span>
                  <span className="font-medium">
                    {formatCurrency(purchaseAnalytics?.totalDiscountAmount || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{dashboardStats?.totalOrders || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Revenue</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        (purchaseAnalytics?.totalRevenue || 0) +
                          (purchaseAnalytics?.totalDiscountAmount || 0)
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue + Discounts (gross sales)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
