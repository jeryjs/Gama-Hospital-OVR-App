import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
    employeeId?: string | null;
    department?: string | null;
    position?: string | null;
  }
}
