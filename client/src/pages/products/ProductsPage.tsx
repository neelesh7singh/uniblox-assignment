/**
 * ProductsPage Component
 * Main product catalog page with filtering, searching, and pagination
 */

import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProductsStore } from '@/store/products';
import { useAppStore } from '@/store/app';

/**
 * Main products catalog page
 */
export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    products,
    categories,
    filters,
    pagination,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    setFilters,
    clearFilters,
    setPage,
    clearError,
  } = useProductsStore();

  const addNotification = useAppStore((state) => state.addNotification);

  // Initialize page data
  useEffect(() => {
    // Load URL params into filters
    const urlFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const page = Number(searchParams.get('page')) || 1;

    // Always fetch products on mount or when URL params change
    fetchProducts({ ...urlFilters, page });

    // Fetch categories if not loaded
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [searchParams, fetchProducts, fetchCategories, categories.length]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();

    if (filters.search) newParams.set('search', filters.search);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.sortBy && filters.sortBy !== 'createdAt') newParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== 'desc')
      newParams.set('sortOrder', filters.sortOrder);
    if (pagination.page > 1) newParams.set('page', pagination.page.toString());

    setSearchParams(newParams);
  }, [filters, pagination.page, setSearchParams]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    clearFilters();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);

    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle load more (for infinite scroll)
  const handleLoadMore = () => {
    if (!loading.products && pagination.page < pagination.pages) {
      fetchProducts({ page: pagination.page + 1 });
    }
  };

  // Handle retry
  const handleRetry = () => {
    clearError();
    fetchProducts();
  };

  // Show notification on error
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Products Error',
        message: error,
        duration: 5000,
      });
    }
  }, [error, addNotification]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover amazing products with exclusive discounts and fast delivery
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-80 flex-shrink-0">
          <ProductFilters
            filters={filters}
            categories={categories}
            loading={loading.products}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {loading.products ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  `${pagination.total} Products Found`
                )}
              </h2>

              {filters.search && (
                <span className="text-sm text-muted-foreground">for "{filters.search}"</span>
              )}
            </div>

            {/* Mobile Filter Toggle would go here if needed */}
          </div>

          <Separator className="mb-6" />

          {/* Products Grid */}
          <ProductGrid
            products={products}
            loading={loading.products}
            error={error}
            onRetry={handleRetry}
            emptyMessage={
              filters.search || filters.category || filters.minPrice || filters.maxPrice
                ? 'No products match your current filters. Try adjusting your search criteria.'
                : 'No products available at the moment. Please check back later.'
            }
            emptyIcon={<Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />}
            className="mb-8"
          />

          {/* Pagination Controls */}
          {products.length > 0 && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page Info */}
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} products
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading.products}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
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
                        disabled={loading.products}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading.products}
                >
                  Next
                </Button>
              </div>

              {/* Load More Button (alternative to pagination) */}
              {pagination.page < pagination.pages && (
                <div className="w-full flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading.products}
                    className="min-w-[120px]"
                  >
                    {loading.products ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Products'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
