import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'gamahospital.com';
// const IS_DEV = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async signOut({ token }) {
      console.log('User signed out:', token.email);
    },
  },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          prompt: 'select_account',
          scope: 'openid profile email User.Read User.ReadBasic.All Directory.Read.All', // Extended permissions for more user details
        },
      },
      async profile(profile, tokens) {
        // Fetch additional user details from Microsoft Graph API
        let graphData: any = {};

        try {
          const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          if (graphResponse.ok) {
            graphData = await graphResponse.json();
          }
        } catch (error) {
          console.error('Error fetching Microsoft Graph data:', error);
        }

        // Extract all available user information
        return {
          id: profile.sub || profile.oid || graphData.id,
          name: profile.name || graphData.displayName,
          email: profile.email || profile.preferred_username || profile.upn || graphData.mail || graphData.userPrincipalName,
          image: graphData.photo || null,

          // Additional Azure AD/Entra ID fields
          givenName: profile.given_name || graphData.givenName,
          surname: profile.family_name || graphData.surname,
          jobTitle: graphData.jobTitle,
          department: graphData.department,
          officeLocation: graphData.officeLocation,
          mobilePhone: graphData.mobilePhone,
          businessPhones: graphData.businessPhones,
          employeeId: graphData.employeeId,
          userPrincipalName: profile.preferred_username || graphData.userPrincipalName,

          // Entra ID groups/roles - these will be used for role management
          groups: profile.groups || [], // If using group claims
          roles: profile.roles || [], // If using app roles

          // Additional metadata
          accountEnabled: graphData.accountEnabled,
          companyName: graphData.companyName,
          city: graphData.city,
          country: graphData.country,
          usageLocation: graphData.usageLocation,
        } as any;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prevent redirect loops and header size issues

      // If URL contains /login, redirect to dashboard
      if (url.includes('/login')) {
        return `${baseUrl}/dashboard`;
      }

      // If URL is too long (potential loop), redirect to dashboard
      if (url.length > 200) {
        return `${baseUrl}/dashboard`;
      }

      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },

    async signIn({ user, account }) {
      console.log('🔐 SignIn attempt:', {
        email: user.email,
        name: user.name,
        department: (user as any).department,
        jobTitle: (user as any).jobTitle,
        groups: (user as any).groups,
        roles: (user as any).roles,
      });

      // Skip domain check in development mode
      if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.log('❌ Sign in rejected: Invalid domain for', user.email);
        return false;
      }

      try {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        // Map Entra ID roles/groups to our application roles
        // You can customize this mapping based on your Entra ID setup
        const mapEntraRoleToAppRole = (user: any): string => {
          const groups = user.groups || [];
          const roles = user.roles || [];
          const jobTitle = (user.jobTitle || '').toLowerCase();

          // Priority 1: Check Entra ID App Roles
          if (roles.includes('Admin') || roles.includes('System Administrator')) return 'admin';
          if (roles.includes('Quality Manager') || roles.includes('QI Manager')) return 'quality_manager';
          if (roles.includes('Department Head') || roles.includes('HOD')) return 'department_head';
          if (roles.includes('Supervisor') || roles.includes('Team Lead')) return 'supervisor';

          // Priority 2: Check Entra ID Security Groups (you'll need to configure these in Azure)
          // Example: if (groups.includes('SG-OVR-Admins')) return 'admin';

          // Priority 3: Check Job Title
          if (jobTitle.includes('administrator') || jobTitle.includes('admin')) return 'admin';
          if (jobTitle.includes('quality') && jobTitle.includes('manager')) return 'quality_manager';
          if (jobTitle.includes('head') || jobTitle.includes('hod')) return 'department_head';
          if (jobTitle.includes('supervisor') || jobTitle.includes('lead')) return 'supervisor';

          // Default role
          return 'employee';
        };

        const mappedRole = mapEntraRoleToAppRole(user);

        if (existingUser) {
          if (!existingUser.isActive) {
            console.log('❌ User account is inactive:', user.email);
            return false;
          }

          // Update user with all available information from Entra ID
          await db
            .update(users)
            .set({
              azureId: account?.providerAccountId,
              firstName: (user as any).givenName || existingUser.firstName,
              lastName: (user as any).surname || existingUser.lastName,
              role: mappedRole as any, // Update role from Entra ID
              department: (user as any).department || existingUser.department,
              position: (user as any).jobTitle || existingUser.position,
              employeeId: (user as any).employeeId || existingUser.employeeId,
              profilePicture: user.image || existingUser.profilePicture,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));

          console.log('✅ Updated existing user:', user.email, 'with role:', mappedRole);
        } else {
          // Create new user with all available information from Entra ID
          const nameParts = user.name?.split(' ') || ['', ''];
          await db.insert(users).values({
            email: user.email,
            azureId: account?.providerAccountId,
            firstName: (user as any).givenName || nameParts[0] || 'Unknown',
            lastName: (user as any).surname || nameParts.slice(1).join(' ') || 'User',
            role: mappedRole as any,
            department: (user as any).department,
            position: (user as any).jobTitle,
            employeeId: (user as any).employeeId,
            profilePicture: user.image,
            isActive: true,
          });

          console.log('✅ Created new user:', user.email, 'with role:', mappedRole);
        }

        return true;
      } catch (error) {
        console.error('❌ Sign in error:', error);
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
        session.user.role = (session.user.name?.toLowerCase().includes('jery') ? 'admin' : token.role) as NextAuthUser['role'];  // Testing: set specific role for me
        session.user.employeeId = token.employeeId as string | null;
        session.user.department = token.department as string | null;
        session.user.position = token.position as string | null;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
};
