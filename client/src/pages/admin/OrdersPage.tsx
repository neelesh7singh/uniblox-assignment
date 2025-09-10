/**
 * OrdersPage Component
 * Admin page for managing all orders
 */

import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MoreHorizontal,
  Package,
  Truck,
  User,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { formatCurrency, formatDate } from '@/lib/utils';
import { useAdminStore } from '@/store/admin';
import { useAppStore } from '@/store/app';
import { OrderStatus } from '@/types';

/**
 * Order status configuration
 */
const ORDER_STATUS_CONFIG = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

/**
 * OrdersPage component for admin order management
 */
export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { orders, loading, pagination, fetchOrders, updateOrderStatus } = useAdminStore();
  const { addNotification } = useAppStore();

  // Load orders on component mount and when filters change
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || 'all';

    setCurrentPage(page);
    setStatusFilter(status);

    fetchOrders(page, 20);
  }, [searchParams, fetchOrders]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams({
      page: page.toString(),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      addNotification({
        type: 'success',
        title: 'Order Updated',
        message: `Order status updated to ${ORDER_STATUS_CONFIG[newStatus as OrderStatus]?.label}`,
        duration: 3000,
      });

      // Refresh orders
      fetchOrders(currentPage, 20);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update order status',
        duration: 5000,
      });
    }
  };

  // Get status badge component
  const getStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Loading skeleton
  const OrderSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading.orders ? (
          // Loading state
          Array.from({ length: 5 }).map((_, index) => <OrderSkeleton key={index} />)
        ) : orders.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all'
                  ? `No orders found with status "${ORDER_STATUS_CONFIG[statusFilter as OrderStatus]?.label}"`
                  : 'No orders have been placed yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          // Orders list
          orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    {/* Order ID and Date */}
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* Customer and Items */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Customer ID: {order.userId.slice(-8)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(order.total)}
                      {order.discountAmount > 0 && (
                        <span className="text-sm text-green-600 ml-2">
                          (Saved {formatCurrency(order.discountAmount)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    {getStatusBadge(order.status)}

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Status Updates */}
                        {order.status !== OrderStatus.DELIVERED &&
                          order.status !== OrderStatus.CANCELLED && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>

                              {order.status === OrderStatus.PENDING && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(order.id, OrderStatus.CONFIRMED)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm Order
                                </DropdownMenuItem>
                              )}

                              {order.status === OrderStatus.CONFIRMED && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(order.id, OrderStatus.SHIPPED)}
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark as Shipped
                                </DropdownMenuItem>
                              )}

                              {order.status === OrderStatus.SHIPPED && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(order.id, OrderStatus.DELIVERED)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Delivered
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                        {/* Cancel Order */}
                        {order.status === OrderStatus.PENDING && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.orders.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * 20 + 1} to{' '}
                {Math.min(currentPage * 20, pagination.orders.total)} of {pagination.orders.total}{' '}
                orders
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.orders.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.orders.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrdersPage;
