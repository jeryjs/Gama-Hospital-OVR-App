import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: 'admin' | 'quality_manager' | 'department_head' | 'supervisor' | 'employee';
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends User {} // Extend JWT to include User properties
}
