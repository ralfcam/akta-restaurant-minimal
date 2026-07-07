import { kv } from '@vercel/kv';
import { Post, User, PostStatus } from './types';

export async function getPost(slug: string): Promise<Post | null> {
  const data = await kv.hgetall(`post:${slug}`);
  if (!data || Object.keys(data).length === 0) return null;
  return data as Post;
}

export async function savePost(post: Post): Promise<void> {
  const score = new Date(post.createdAt).getTime();
  const pipeline = kv.pipeline();
  
  // 1. Hash per post
  pipeline.hset(`post:${post.slug}`, post);
  
  // 2. Sorted set for ordering
  pipeline.zadd('posts:by-date', { score, member: post.slug });
  
  // 3. Set per author
  pipeline.sadd(`author:${post.authorId}:posts`, post.slug);
  
  // 4. Set for status filtering
  if (post.status === 'published') {
    pipeline.sadd('posts:status:published', post.slug);
    pipeline.srem('posts:status:draft', post.slug);
  } else {
    pipeline.sadd('posts:status:draft', post.slug);
    pipeline.srem('posts:status:published', post.slug);
  }
  
  await pipeline.exec();
}

export async function deletePost(slug: string): Promise<void> {
  const post = await getPost(slug);
  if (!post) return;
  
  const pipeline = kv.pipeline();
  pipeline.del(`post:${slug}`);
  pipeline.zrem('posts:by-date', slug);
  pipeline.srem(`author:${post.authorId}:posts`, slug);
  pipeline.srem('posts:status:published', slug);
  pipeline.srem('posts:status:draft', slug);
  
  await pipeline.exec();
}

export async function listPosts(status?: PostStatus): Promise<Post[]> {
  let slugs: string[] = [];
  
  if (status) {
    slugs = await kv.smembers(`posts:status:${status}`);
  } else {
    slugs = await kv.zrange('posts:by-date', 0, -1, { rev: true });
  }
  
  if (slugs.length === 0) return [];
  
  const pipeline = kv.pipeline();
  for (const slug of slugs) {
    pipeline.hgetall(`post:${slug}`);
  }
  
  const results = await pipeline.exec();
  const posts = results
    .filter((p): p is Post => p !== null && typeof p === 'object' && Object.keys(p).length > 0)
    .map(p => p as Post);
    
  if (status) {
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  return posts;
}

export async function getUser(email: string): Promise<User | null> {
  const data = await kv.hgetall(`user:${email}`);
  if (!data || Object.keys(data).length === 0) return null;
  return data as User;
}

export async function saveUser(user: User): Promise<void> {
  await kv.hset(`user:${user.email}`, user);
}
