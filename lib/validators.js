import { z } from 'zod';

export const urlSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .refine((url) => {
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        new URL(fullUrl);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid URL format')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const reportSchema = z.object({
  url: z.string().url('Invalid URL'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});
