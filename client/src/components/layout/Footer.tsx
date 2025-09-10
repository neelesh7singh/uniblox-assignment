/**
 * Footer Component
 * Application footer with links and company information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';

interface FooterProps {
  className?: string;
}

/**
 * Main application footer component
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { title: 'All Products', href: ROUTES.PRODUCTS },
      { title: 'Categories', href: `${ROUTES.PRODUCTS}?category=all` },
      { title: 'New Arrivals', href: `${ROUTES.PRODUCTS}?sort=newest` },
      { title: 'Best Sellers', href: `${ROUTES.PRODUCTS}?sort=popular` },
    ],
    account: [
      { title: 'My Profile', href: ROUTES.PROFILE },
      { title: 'Order History', href: ROUTES.ORDERS },
      { title: 'Shopping Cart', href: ROUTES.CART },
    ],
  };

  return (
    <footer className={`bg-background border-t ${className}`}>
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Uniblox</span>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              Your trusted e-commerce platform for quality products and exceptional shopping
              experiences. Discover, shop, and enjoy seamless online shopping.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.title}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.title}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Uniblox E-commerce. All rights reserved.
          </div>

          <div className="text-sm text-muted-foreground">
            Built with ❤️ using React & TypeScript
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
