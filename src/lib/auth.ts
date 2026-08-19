import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import ResendProvider from 'next-auth/providers/resend';
import { getUser } from './kv';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { Redis } from "@upstash/redis";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...(redisClient ? { adapter: UpstashRedisAdapter(redisClient) } : {}),
  providers: [
    ...(process.env.RESEND_API_KEY ? [
      ResendProvider({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      })
    ] : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Fallback to Env Variables (to be backward compatible and super reliable!)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@akta.ch';
        const adminPassword = process.env.ADMIN_PASSWORD || 'b39dD%n9PY!CwH2PDc';
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: 'admin-env',
            email: adminEmail,
            role: 'admin',
          };
        }
        
        // 2. Database lookup in Vercel KV
        const user = await getUser(credentials.email as string);
        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ]
});

export async function verifyAdmin(request: Request): Promise<boolean> {
  // 1. Check NextAuth session
  const session = await auth();
  if (session?.user && (session.user as any).role === 'admin') {
    return true;
  }

  // 2. Fallback to Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'b39dD%n9PY!CwH2PDc';
    return token === adminPassword;
  }

  return false;
}
