/**
 * AnalyticsPage Component
 * Admin page for viewing analytics and statistics
 */

import { DollarSign, Percent, RefreshCw, ShoppingCart, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { formatCurrency } from '@/lib/utils';
import { useAdminStore } from '@/store/admin';
import { useAppStore } from '@/store/app';

/**
 * AnalyticsPage component for viewing admin analytics
 */
export const AnalyticsPage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { purchaseAnalytics, loading, error, fetchAnalytics, clearError } = useAdminStore();

  const addNotification = useAppStore((state) => state.addNotification);

  // Load analytics on component mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle error notifications
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error Loading Analytics',
        message: error,
        duration: 5000,
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAnalytics();
      addNotification({
        type: 'success',
        title: 'Analytics Updated',
        message: 'Analytics data has been refreshed successfully.',
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh analytics data.',
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of sales, purchases, and discount performance
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || loading.analytics}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items Purchased */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Purchased</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.analytics ? (
              <LoadingSkeleton />
            ) : (
              <div className="text-2xl font-bold">
                {purchaseAnalytics?.totalPurchases?.toLocaleString() || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>

        {/* Total Purchase Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.analytics ? (
              <LoadingSkeleton />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(purchaseAnalytics?.totalRevenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total revenue generated</p>
          </CardContent>
        </Card>

        {/* Total Discount Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discount Amount</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.analytics ? (
              <LoadingSkeleton />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency((purchaseAnalytics?.totalRevenue || 0) * 0.1)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total discounts given</p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.analytics ? (
              <LoadingSkeleton />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(purchaseAnalytics?.averageOrderValue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Discount Codes List */}</div>
    </div>
  );
};

export default AnalyticsPage;
