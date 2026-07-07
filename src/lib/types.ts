import { z } from 'zod';

export const PostStatusSchema = z.enum(['draft', 'published']);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-_]+$/, 'Slug must be alphanumeric/dashes'),
  body: z.string().min(1, 'Body is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  status: PostStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Post = z.infer<typeof PostSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().min(1, 'Password hash is required'),
  role: z.enum(['admin', 'user']),
});
export type User = z.infer<typeof UserSchema>;
