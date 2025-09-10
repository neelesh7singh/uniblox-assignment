/**
 * ProductDetailPage Component
 * Displays detailed product information with purchase options
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Star,
  Package,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useProductsStore } from '@/store/products';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';

/**
 * Product detail page with full product information
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    currentProduct: product,
    loading,
    error,
    fetchProductById,
    clearCurrentProduct,
    clearError,
  } = useProductsStore();

  const { addItem, isLoading: cartLoading } = useCartStore();
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  // Fetch product on mount
  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }

    return () => {
      clearCurrentProduct();
    };
  }, [id, fetchProductById, clearCurrentProduct]);

  // Handle add to cart
  const handleAddToCart = async () => {
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

    if (!product) return;

    try {
      await addItem(product.id, quantity);

      // Reset quantity to 1 after successful add
      setQuantity(1);

      addNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${product.name} (${quantity}) has been added to your cart`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  // Handle quantity changes
  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Handle retry
  const handleRetry = () => {
    clearError();
    if (id) {
      fetchProductById(id);
    }
  };

  // Loading state
  if (loading.currentProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">Loading product...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRetry}>
              Try Again
            </Button>
            <Button asChild>
              <Link to={ROUTES.PRODUCTS}>Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No product found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to={ROUTES.PRODUCTS}>Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link to={ROUTES.HOME} className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link to={ROUTES.PRODUCTS} className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {product.imageUrl && !imageError ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
                {isLowStock && !isOutOfStock && (
                  <Badge variant="secondary">Only {product.stock} left</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category and Name */}
          <div>
            <Badge variant="outline" className="mb-2">
              {product.category}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.0) • 24 reviews</span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </div>
            <p className="text-sm text-muted-foreground">Stock: {product.stock} units available</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <label className="text-sm font-medium mr-3">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    className="h-10 w-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock || cartLoading}
                className="flex-1"
              >
                {cartLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isOutOfStock
                      ? 'Out of Stock'
                      : `Add to Cart • ${formatCurrency(product.price * quantity)}`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Features */}
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span className="text-sm">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-12 space-y-8">
        <Separator />

        {/* Specifications */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock:</span>
                <span className="font-medium">{product.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added:</span>
                <span className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetailPage;
