/**
 * HomePage Component
 * Landing page with hero section and featured content
 */

import { ArrowRight, ShoppingBag } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth';

/**
 * HomePage component with hero section and features
 */
export const HomePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Hero Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
                Welcome to <span className="text-primary">Uniblox</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover amazing products, enjoy seamless shopping experiences, and get exclusive
                discounts on every purchase. Your trusted e-commerce destination.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link to={ROUTES.PRODUCTS}>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              {!user && (
                <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                  <Link to={ROUTES.REGISTER}>Create Account</Link>
                </Button>
              )}
            </div>

            {/* Welcome Message for Logged-in Users */}
            {user && (
              <div className="bg-primary/5 rounded-lg p-6 mt-8 max-w-2xl mx-auto">
                <p className="text-lg text-foreground">
                  Welcome back, <strong>{user.firstName}</strong>! 👋
                </p>
                <p className="text-muted-foreground mt-2">
                  Ready to continue shopping? Check out our latest products and exclusive deals.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Start Shopping?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of satisfied customers and discover amazing products with exclusive
              discounts and fast delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link to={ROUTES.PRODUCTS}>
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              {user && (
                <Button asChild variant="outline" size="lg">
                  <Link to={ROUTES.PROFILE}>My Account</Link>
                </Button>
              )}
            </div>

            {/* Special Offer Banner */}
            <div className="bg-primary text-primary-foreground rounded-lg p-6 mt-12">
              <h3 className="text-xl font-semibold mb-2">🎉 Special Offer!</h3>
              <p className="text-primary-foreground/90">
                Get 10% off on every 3rd order automatically applied at checkout!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
