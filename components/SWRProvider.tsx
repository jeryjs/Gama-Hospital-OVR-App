'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global cache and deduplication settings
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        revalidateOnFocus: false, // Don't revalidate when window regains focus
        revalidateOnReconnect: true, // Revalidate when network reconnects
        shouldRetryOnError: false, // Don't retry failed requests
        keepPreviousData: true, // Keep previous data while revalidating
        suspense: true, // Enable Suspense mode for declarative loading states
      }}
    >
      {children}
    </SWRConfig>
  );
}
