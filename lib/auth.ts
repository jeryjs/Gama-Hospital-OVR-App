import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { APP_ROLES } from './constants';

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN?.split(',') || ['gamahospital.com']).map((d) => d.trim().toLowerCase());
const MAIL_SCOPE = 'openid profile email User.Read Mail.Send offline_access';
// const IS_DEV = process.env.NODE_ENV === 'development';

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function isAllowedDomainEmail(email: string): boolean {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAIN.includes(domain);
}

async function refreshAzureAccessToken(token: JWT): Promise<JWT> {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID;

  if (!tenantId) {
    throw new Error('NEXT_PUBLIC_AZURE_AD_TENANT_ID is required to refresh Azure access token');
  }

  if (!token.refreshToken) {
    throw new Error('Missing refresh token for Azure access token refresh');
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
      scope: MAIL_SCOPE,
    }),
  });

  const refreshed = await response.json();

  if (!response.ok) {
    throw new Error(`Azure token refresh failed: ${JSON.stringify(refreshed)}`);
  }

  const scope = String(refreshed.scope || '');

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
    refreshToken: refreshed.refresh_token || token.refreshToken,
    mailScopeGranted: scope.includes('Mail.Send') || token.mailScopeGranted === true,
    tokenError: undefined,
  };
}

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
          scope: MAIL_SCOPE,
        },
      },
      async profile(profile, tokens) {
        // Fetch additional user details from Microsoft Graph API
        let graphData: any = {};

        try {
          // Fetch user profile
          const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (graphResponse.ok) {
            graphData = await graphResponse.json();
          }
        } catch (error) {
          console.error('Error fetching Microsoft Graph data:', error);
        }

        // Try to fetch profile photo as binary and convert to data URI (base64).
        // Graph returns the binary at /me/photo/$value (requires User.Read scope).
        if (tokens?.access_token) {
          try {
            const photoResp = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            if (photoResp.ok) {
              const arrBuf = await photoResp.arrayBuffer();
              // Buffer is available in Node, used server-side by NextAuth
              const buffer = Buffer.from(arrBuf);
              const mime = photoResp.headers.get('content-type') || 'image/jpeg';
              graphData.photo = `data:${mime};base64,${buffer.toString('base64')}`;
            } else {
              // No photo; keep graphData.photo undefined
              graphData.photo = undefined;
            }
          } catch (err) {
            console.error('Error fetching profile photo:', err);
          }
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
          groups: profile.groups || [], // Group Object IDs from token
          roles: profile.roles || [], // App role IDs (we use groups instead)

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

      try {
        const normalizedEmail = normalizeEmail(user.email);
        if (!normalizedEmail) {
          console.log('❌ Sign in rejected: missing email claim');
          return false;
        }

        // Pseudo auto-provision path: only verified in-domain emails may pass
        if (!isAllowedDomainEmail(normalizedEmail)) {
          console.log('❌ Sign in rejected: disallowed domain:', normalizedEmail);
          return false;
        }

        if (!account?.providerAccountId) {
          console.log('❌ Sign in rejected: missing Azure account object ID');
          return false;
        }

        const existingUser = await db.query.users.findFirst({
          where: sql`LOWER(${users.email}) = ${normalizedEmail}`,
        });

        if (!existingUser) {
          const nameParts = user.name?.trim().split(/\s+/) || [];
          const firstName = (user as any).givenName || nameParts[0] || 'New';
          const lastName = (user as any).surname || nameParts.slice(1).join(' ') || 'User';

          await db.insert(users).values({
            email: normalizedEmail,
            azureId: account.providerAccountId,
            firstName,
            lastName,
            roles: [APP_ROLES.EMPLOYEE],
            department: (user as any).department,
            position: (user as any).jobTitle,
            employeeId: (user as any).employeeId,
            profilePicture: user.image?.startsWith('data:') ? undefined : user.image,
            isActive: true,
          });

          console.log('✅ Auto-provisioned new employee account:', normalizedEmail);
          return true;
        }

        // Only active users may sign in
        if (!existingUser.isActive) {
          console.log('❌ Sign in rejected: account inactive:', normalizedEmail);
          return false;
        }

        // Harden identity binding: once bound, Azure object ID must match
        if (existingUser.azureId && existingUser.azureId !== account.providerAccountId) {
          console.log('❌ Sign in rejected: Azure identity mismatch for', normalizedEmail, {
            expected: existingUser.azureId,
            received: account.providerAccountId,
          });
          return false;
        }

        // Bind Azure object ID on first approved sign-in and keep profile picture fresh
        await db
          .update(users)
          .set({
            azureId: existingUser.azureId || account.providerAccountId,
            profilePicture: (user.image?.startsWith('data:') ? undefined : user.image) || existingUser.profilePicture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));

        console.log('✅ Sign in approved for existing DB user:', normalizedEmail);

        return true;
      } catch (error) {
        console.error('❌ Sign in error:', error);
        console.error('User email:', user.email);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        const normalizedEmail = normalizeEmail(user.email);

        let dbUser = account.providerAccountId
          ? await db.query.users.findFirst({
            where: eq(users.azureId, account.providerAccountId),
          })
          : undefined;

        if (!dbUser && normalizedEmail) {
          dbUser = await db.query.users.findFirst({
            where: sql`LOWER(${users.email}) = ${normalizedEmail}`,
          });
        }

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token || token.refreshToken;
        token.accessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        token.mailScopeGranted = String(account.scope || '').includes('Mail.Send');

        if (!dbUser || !dbUser.isActive) {
          token.tokenError = 'UserNotApproved';
          return token;
        }

        token.id = dbUser.id.toString();
        token.roles = dbUser.roles;
        token.employeeId = dbUser.employeeId;
        token.department = dbUser.department;
        token.position = dbUser.position;
        token.image = dbUser.profilePicture;
        token.tokenError = undefined;

        return token;
      }

      // Keep existing token if not yet close to expiry
      if (typeof token.accessTokenExpiresAt === 'number' && Date.now() < token.accessTokenExpiresAt - 60_000) {
        return token;
      }

      // If we don't have refresh token, keep stale token and mark error
      if (!token.refreshToken) {
        return {
          ...token,
          tokenError: 'MissingRefreshToken',
        };
      }

      try {
        return await refreshAzureAccessToken(token);
      } catch (error) {
        console.error('Failed to refresh Azure access token:', error);
        return {
          ...token,
          tokenError: 'RefreshAccessTokenError',
        };
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as any) || [APP_ROLES.EMPLOYEE];
        session.user.employeeId = token.employeeId as string | null;
        session.user.department = token.department as string | null;
        session.user.position = token.position as string | null;
        session.user.image = token.image as string | undefined;
        session.user.mailScopeGranted = token.mailScopeGranted === true;
        session.user.tokenError = token.tokenError as string | undefined;
      }
      return session;
    },
  },
};
