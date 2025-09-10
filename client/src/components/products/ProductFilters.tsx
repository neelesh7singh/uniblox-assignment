/**
 * ProductFilters Component
 * Provides filtering, searching, and sorting controls for products
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useDebounce } from '@/lib/utils';
import type { ProductFilter } from '@/types';

interface ProductFiltersProps {
  filters: ProductFilter;
  categories: string[];
  loading?: boolean;
  onFiltersChange: (filters: Partial<ProductFilter>) => void;
  onClearFilters: () => void;
  className?: string;
}

interface SortOption {
  value: string;
  label: string;
  order: 'asc' | 'desc';
}

const sortOptions: SortOption[] = [
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'createdAt', label: 'Oldest First', order: 'asc' },
  { value: 'name', label: 'Name A-Z', order: 'asc' },
  { value: 'name', label: 'Name Z-A', order: 'desc' },
  { value: 'price', label: 'Price Low to High', order: 'asc' },
  { value: 'price', label: 'Price High to Low', order: 'desc' },
  { value: 'stock', label: 'Stock Low to High', order: 'asc' },
  { value: 'stock', label: 'Stock High to Low', order: 'desc' },
];

/**
 * ProductFilters component for filtering and searching products
 */
export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  loading = false,
  onFiltersChange,
  onClearFilters,
  className = '',
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  });

  // Debounce search input
  const debouncedSearch = useDebounce(localSearch, 500);

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  // Get current sort option display
  const currentSortOption = sortOptions.find(
    (option) => option.value === filters.sortBy && option.order === filters.sortOrder
  );

  // Handle price range changes
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const newPriceRange = { ...priceRange, [type]: value };
    setPriceRange(newPriceRange);

    const numValue = value ? parseFloat(value) : undefined;

    if (type === 'min') {
      onFiltersChange({ minPrice: numValue });
    } else {
      onFiltersChange({ maxPrice: numValue });
    }
  };

  // Clear individual filter
  const clearFilter = (filterKey: keyof ProductFilter) => {
    switch (filterKey) {
      case 'search':
        setLocalSearch('');
        onFiltersChange({ search: '' });
        break;
      case 'category':
        onFiltersChange({ category: '' });
        break;
      case 'minPrice':
        setPriceRange((prev) => ({ ...prev, min: '' }));
        onFiltersChange({ minPrice: undefined });
        break;
      case 'maxPrice':
        setPriceRange((prev) => ({ ...prev, max: '' }));
        onFiltersChange({ maxPrice: undefined });
        break;
    }
  };

  // Count active filters
  const activeFilters = [
    filters.search && 'Search',
    filters.category && 'Category',
    filters.minPrice && 'Min Price',
    filters.maxPrice && 'Max Price',
  ].filter(Boolean);

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <div className={`space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
              {localSearch && (
                <button
                  onClick={() => clearFilter('search')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sort */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sort By</CardTitle>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {currentSortOption?.label || 'Sort by...'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={`${option.value}-${option.order}`}
                    onClick={() =>
                      onFiltersChange({
                        sortBy: option.value as 'name' | 'price' | 'createdAt' | 'stock',
                        sortOrder: option.order,
                      })
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* Categories */}
        {categories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Categories
                {filters.category && (
                  <button
                    onClick={() => clearFilter('category')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => onFiltersChange({ category: '' })}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !filters.category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onFiltersChange({ category })}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors capitalize ${
                    filters.category === category
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {category}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Filters Summary */}
        {activeFilters.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Active Filters
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {filters.search}
                    <button onClick={() => clearFilter('search')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {filters.category}
                    <button onClick={() => clearFilter('category')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.minPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Min: ${filters.minPrice}
                    <button onClick={() => clearFilter('minPrice')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.maxPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Max: ${filters.maxPrice}
                    <button onClick={() => clearFilter('maxPrice')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
