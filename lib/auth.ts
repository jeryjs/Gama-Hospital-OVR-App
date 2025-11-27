import { NextAuthOptions, User } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'gamahospital.com';
const IS_DEV = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Skip domain check in development mode
      if (!IS_DEV && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.log('Sign in rejected: Invalid domain for', user.email);
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
              azureId: account?.providerAccountId,
              profilePicture: user.image,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
        } else {
          const nameParts = user.name?.split(' ') || ['', ''];
          await db.insert(users).values({
            email: user.email,
            azureId: account?.providerAccountId,
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
        console.error('User email:', user.email);
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
        session.user.role = (session.user.name?.toLowerCase().includes('jery') ? 'department_head' : token.role) as User['role'];  // Testing: set specific role for me
        session.user.employeeId = token.employeeId as string | null;
        session.user.department = token.department as string | null;
        session.user.position = token.position as string | null;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
};
