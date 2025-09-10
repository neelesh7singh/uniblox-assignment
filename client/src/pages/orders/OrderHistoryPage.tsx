/**
 * OrderHistoryPage Component
 * Displays user's order history with pagination and filtering
 */

import { Filter, Package, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import OrderItem from '@/components/orders/OrderItem';
import OrderStats from '@/components/orders/OrderStats';

import { useAppStore } from '@/store/app';
import { useOrdersStore } from '@/store/orders';

/**
 * OrderHistoryPage component for displaying user's order history
 */
export const OrderHistoryPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    orders,
    orderStats,
    pagination,
    loading,
    error,
    fetchOrders,
    fetchOrderStats,
    clearError,
  } = useOrdersStore();

  const addNotification = useAppStore((state) => state.addNotification);

  // Load initial data
  useEffect(() => {
    fetchOrders(1, 10);
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);

  // Handle error notifications
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error Loading Orders',
        message: error,
        duration: 5000,
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
  };

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchOrders(1, pagination.limit);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Note: Backend doesn't support search yet, but we can filter client-side
    // In a real app, you'd want to implement server-side search
  };

  // Filter orders by search term (client-side filtering)
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.items.some((item) => item.productName.toLowerCase().includes(searchLower))
    );
  });

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Order History</h1>
        <p className="text-muted-foreground">View and track all your orders</p>
      </div>

      {/* Order Statistics */}
      {orderStats && <OrderStats stats={orderStats} loading={loading.stats} />}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders or products..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value || 'all'}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {loading.orders ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          // Orders list
          <>
            {filteredOrders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading.orders}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const startPage = Math.max(1, pagination.page - 2);
                    const pageNum = startPage + i;

                    if (pageNum > pagination.pages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading.orders}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading.orders}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter
                  ? 'No orders match your current filters. Try adjusting your search or filter criteria.'
                  : "You haven't placed any orders yet. Start shopping to see your orders here."}
              </p>
              {!searchTerm && !statusFilter && (
                <Button asChild>
                  <a href="/products">Start Shopping</a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
