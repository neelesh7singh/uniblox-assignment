/**
 * Product form validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Create product form validation schema
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Product description is required')
    .min(10, 'Product description must be at least 10 characters')
    .max(1000, 'Product description must be less than 1000 characters'),
  price: z
    .number()
    .min(0.01, 'Price must be at least $0.01')
    .max(999999.99, 'Price must be less than $999,999.99'),
  category: z
    .string()
    .min(1, 'Category is required')
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters'),
  imageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock must be less than 999,999'),
});

/**
 * Type exports for form data
 */
export type CreateProductFormData = z.infer<typeof createProductSchema>;
