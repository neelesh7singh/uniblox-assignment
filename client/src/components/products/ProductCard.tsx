/**
 * ProductCard Component
 * Displays individual product information in a card format
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, truncateText } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
  className?: string;
}

/**
 * ProductCard component for displaying product information
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showQuickActions = true,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const navigate = useNavigate();
  const { addItem, isLoading } = useCartStore();
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button

    if (!user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to add items to your cart.',
        duration: 4000,
      });
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      await addItem(product.id, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Stock status
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className={`group h-full overflow-hidden transition-all hover:shadow-lg ${className}`}>
      <Link to={`${ROUTES.PRODUCTS}/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Package className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Stock Status Badge */}
          {isOutOfStock && (
            <Badge variant="destructive" className="absolute left-2 top-2">
              Out of Stock
            </Badge>
          )}

          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              Only {product.stock} left
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Category */}
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>

            {/* Product Name */}
            <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
              {truncateText(product.name, 60)}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(product.description, 100)}
            </p>

            {/* Rating (placeholder - could be enhanced with real ratings) */}
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
                {/* Could add original price for discounts */}
              </div>

              {/* Stock Count */}
              <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
            </div>
          </div>
        </CardContent>
      </Link>

      {/* Action Buttons */}
      {showQuickActions && (
        <div className="p-4 pt-0">
          <Button className="w-full" onClick={handleAddToCart} disabled={isOutOfStock || isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProductCard;
