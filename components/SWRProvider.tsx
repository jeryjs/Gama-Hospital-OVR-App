'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global cache and deduplication settings
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        revalidateIfStale: false, // Don't revalidate if data is stale
        revalidateOnFocus: false, // Don't revalidate when window regains focus
        revalidateOnReconnect: true, // Revalidate when network reconnects
        shouldRetryOnError: false, // Don't retry failed requests
        // Keep previous data while revalidating
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
