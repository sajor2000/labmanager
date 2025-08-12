import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      role: string;
      avatar?: string | null;
      avatarUrl?: string | null;
      initials: string;
      labs?: Array<{
        id: string;
        name: string;
        shortName: string;
        isAdmin: boolean;
      }>;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string | null;
    avatarUrl?: string | null;
    initials: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
            isActive: true,
          },
          include: {
            labs: {
              where: {
                isActive: true,
              },
              include: {
                lab: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          avatarUrl: user.avatarUrl,
          initials: user.initials,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.avatar = user.avatar;
        token.avatarUrl = user.avatarUrl;
        token.initials = user.initials;
      }

      // Update session if triggered
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.initials = token.initials as string;

        // Fetch user's labs
        const userWithLabs = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            labs: {
              where: { isActive: true },
              include: {
                lab: true,
              },
            },
          },
        });

        if (userWithLabs) {
          session.user.labs = userWithLabs.labs.map(membership => ({
            id: membership.lab.id,
            name: membership.lab.name,
            shortName: membership.lab.shortName,
            isAdmin: membership.isAdmin,
          }));
        }
      }

      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});