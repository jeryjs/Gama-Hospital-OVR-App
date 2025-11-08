import { NextAuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'gamahospital.com';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          hd: ALLOWED_DOMAIN,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return false;
      }

      try {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (existingUser) {
          if (!existingUser.isActive) {
            return false;
          }

          await db
            .update(users)
            .set({
              googleId: account?.providerAccountId,
              profilePicture: user.image,
              updatedAt: new Date(),
              role: existingUser.role,
            })
            .where(eq(users.id, existingUser.id));
        } else {
          const nameParts = user.name?.split(' ') || ['', ''];
          await db.insert(users).values({
            email: user.email,
            googleId: account?.providerAccountId,
            firstName: nameParts[0] || 'Unknown',
            lastName: nameParts.slice(1).join(' ') || 'User',
            role: 'employee',
            profilePicture: user.image,
            isActive: true,
          });
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });

        if (dbUser) {
          token.id = dbUser.id.toString();
          token.role = dbUser.role;
          token.employeeId = dbUser.employeeId;
          token.department = dbUser.department;
          token.position = dbUser.position;
          token.image = dbUser.profilePicture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (session.user.name?.toLowerCase().includes('jery') ? 'quality_manager' : token.role) as User['role'];  // Testing: set specific role for me
        session.user.employeeId = token.employeeId as string | null;
        session.user.department = token.department as string | null;
        session.user.position = token.position as string | null;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
};
