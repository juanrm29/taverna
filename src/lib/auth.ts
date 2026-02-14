// ============================================================
// Auth.js v5 (NextAuth) — Google, Discord, GitHub, Credentials
// ============================================================
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // ---- Google OAuth (auto: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET) ----
    Google({
      allowDangerousEmailAccountLinking: true,
    }),

    // ---- Discord OAuth (auto: AUTH_DISCORD_ID, AUTH_DISCORD_SECRET) ----
    Discord({
      allowDangerousEmailAccountLinking: true,
    }),

    // ---- GitHub OAuth (auto: AUTH_GITHUB_ID, AUTH_GITHUB_SECRET) ----
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),

    // ---- Email + Password (Credentials) ----
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.displayName || user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    // Include user ID and role in JWT
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Fetch role from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, displayName: true },
        });
        token.role = dbUser?.role || 'USER';
        token.displayName = dbUser?.displayName || user.name;
      }
      // Handle session update trigger
      if (trigger === 'update' && session) {
        token.displayName = session.displayName || token.displayName;
      }
      return token;
    },
    // Expose user ID and role in session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).displayName = token.displayName;
      }
      return session;
    },
    // On sign in via OAuth, set displayName if not set
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials' && user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { displayName: true },
        });
        if (!dbUser?.displayName && user.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { displayName: user.name, lastLoginAt: new Date() },
          });
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Set displayName on first create
      if (user.id && user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { displayName: user.name },
        });
      }
    },
  },
});
