'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

function SessionWatcher() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user?.tokenError === 'UserNotApproved') {
      signOut({ callbackUrl: '/login?error=AccessDenied' });
    }
  }, [session?.user?.tokenError]);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionWatcher />
      {children}
    </SessionProvider>
  );
}
