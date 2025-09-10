/**
 * ProductGrid Component
 * Displays a grid of product cards with loading and error states
 */

import React from 'react';
import { Package, AlertCircle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  showQuickActions?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
}

/**
 * ProductGrid component for displaying multiple products
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error = null,
  className = '',
  showQuickActions = true,
  emptyMessage = 'No products found',
  emptyIcon,
  onRetry,
}) => {
  // Loading state
  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {[...Array(8)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          {emptyIcon || <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />}
          <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Products grid
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showQuickActions={showQuickActions} />
      ))}
    </div>
  );
};

/**
 * Skeleton loading component for ProductCard
 */
const ProductCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-square bg-muted animate-pulse" />

      {/* Content skeleton */}
      <CardContent className="p-4 space-y-3">
        {/* Category badge skeleton */}
        <div className="w-20 h-5 bg-muted animate-pulse rounded" />

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-muted animate-pulse rounded" />
          <div className="w-3/4 h-5 bg-muted animate-pulse rounded" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-1">
          <div className="w-full h-4 bg-muted animate-pulse rounded" />
          <div className="w-2/3 h-4 bg-muted animate-pulse rounded" />
        </div>

        {/* Rating skeleton */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="w-8 h-3 bg-muted animate-pulse rounded ml-1" />
        </div>

        {/* Price and stock skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-16 h-6 bg-muted animate-pulse rounded" />
          <div className="w-12 h-4 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>

      {/* Button skeleton */}
      <div className="p-4 pt-0">
        <div className="w-full h-10 bg-muted animate-pulse rounded" />
      </div>
    </Card>
  );
};

export default ProductGrid;
