/**
 * AnalyticsPage Component
 * Admin page for viewing analytics and statistics
 */

import { RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/admin/DashboardOverview';

import { useAdminStore } from '@/store/admin';
import { useAppStore } from '@/store/app';

/**
 * AnalyticsPage component for viewing admin analytics
 */
export const AnalyticsPage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { purchaseAnalytics, dashboardStats, loading, error, fetchAnalytics, clearError } =
    useAdminStore();

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

      {/* Dashboard Overview */}
      <DashboardOverview
        purchaseAnalytics={purchaseAnalytics}
        dashboardStats={dashboardStats}
        loading={loading.analytics}
      />
    </div>
  );
};

export default AnalyticsPage;
