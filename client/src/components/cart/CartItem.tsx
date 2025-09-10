/**
 * CartItem Component
 * Displays individual cart item with quantity controls and removal option
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, X, Package, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useCartStore } from '@/store/cart';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { Cart } from '@/types';

interface CartItemProps {
  item: NonNullable<Cart['items']>[0]; // CartItemWithProduct type from cart store
  disabled?: boolean;
  showRemoveButton?: boolean;
  className?: string;
}

/**
 * Individual cart item component
 */
export const CartItem: React.FC<CartItemProps> = ({
  item,
  disabled = false,
  showRemoveButton = true,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { updateItem, removeItem, isLoading } = useCartStore();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemove();
      return;
    }

    try {
      await updateItem(item.productId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(item.productId);
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  };

  const increaseQuantity = () => {
    if (!disabled && item.quantity < item.product.stock) {
      handleQuantityChange(item.quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (!disabled && item.quantity > 1) {
      handleQuantityChange(item.quantity - 1);
    }
  };

  const isOutOfStock = item.product.stock <= 0;
  const isItemLoading = isLoading;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <Link to={`${ROUTES.PRODUCTS}/${item.product.id}`} className="block">
              <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}

                {item.product.imageUrl && !imageError ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className={`w-full h-full object-cover transition-opacity ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Product Details */}
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-grow min-w-0">
                <Link
                  to={`${ROUTES.PRODUCTS}/${item.product.id}`}
                  className="block hover:text-primary transition-colors"
                >
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>
                <Badge variant="outline" className="mt-1 text-xs">
                  {item.product.category}
                </Badge>
              </div>

              {/* Remove Button */}
              {showRemoveButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled || isItemLoading}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  {isItemLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Price and Stock Info */}
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{formatCurrency(item.product.price)}</span>
                <span className="text-sm text-muted-foreground">{item.product.stock} in stock</span>
              </div>

              {/* Out of stock warning */}
              {isOutOfStock && (
                <Badge variant="destructive" className="w-fit">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Quantity Controls and Subtotal */}
            <div className="flex items-center justify-between">
              {/* Quantity Controls */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decreaseQuantity}
                  disabled={disabled || isItemLoading || item.quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm">
                  {item.quantity}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={increaseQuantity}
                  disabled={disabled || isItemLoading || item.quantity >= item.product.stock}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Subtotal */}
              <div className="text-right">
                <div className="font-bold">
                  {formatCurrency(item.subtotal || item.product.price * item.quantity)}
                </div>
                {item.quantity > 1 && (
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItem;
