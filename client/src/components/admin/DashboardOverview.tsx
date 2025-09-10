/**
 * DashboardOverview Component
 * Displays key metrics and analytics overview
 */

import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Gift,
  Calendar,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import AnalyticsCard from './AnalyticsCard';
import { formatCurrency } from '@/lib/utils';

import type { PurchaseAnalyticsSummary } from '@/types';

interface DashboardOverviewProps {
  purchaseAnalytics: PurchaseAnalyticsSummary | null;
  loading: boolean;
}

/**
 * DashboardOverview component for displaying key metrics
 */
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  purchaseAnalytics,
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
          value={0}
          subtitle="Orders placed"
          icon={ShoppingCart}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Users"
          value={0}
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
          title="Active Users"
          value={0}
          subtitle="This month"
          icon={Users}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="New Users"
          value={0}
          subtitle="This month"
          icon={Calendar}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Total Coupons"
          value={0}
          subtitle="Generated"
          icon={Gift}
          format="number"
          loading={loading}
        />

        <AnalyticsCard
          title="Discount Given"
          value={0}
          subtitle="Total savings"
          icon={DollarSign}
          format="currency"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
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
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Revenue chart will be implemented with a charting library
                </p>
                {purchaseAnalytics?.revenueByMonth && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Recent Months:</h4>
                    {purchaseAnalytics.revenueByMonth.slice(-3).map((month, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{month.month}</span>
                        <span className="font-medium">{formatCurrency(month.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
};

export default DashboardOverview;
