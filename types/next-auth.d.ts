import 'next-auth';
import 'next-auth/jwt';
import type { AppRole } from '@/lib/constants';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: AppRole[]; // Changed from single 'role' to 'roles' array
    adGroups?: string[]; // Azure AD security groups
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  // Extend JWT to include User properties
  interface JWT extends User { }  // eslint-disable-line @typescript-eslint/no-empty-object-type
}
