import 'next-auth';
import 'next-auth/jwt';
import type { AppRole } from '@/lib/constants';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: AppRole[];
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
    mailScopeGranted?: boolean;
    tokenError?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends User {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    mailScopeGranted?: boolean;
    tokenError?: string;
  }
}
