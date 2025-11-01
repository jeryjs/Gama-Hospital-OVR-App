import { apiCall } from '@/lib/client/error-handler';
import type { OVRReportWithRelations } from '@/lib/types';
import useSWR from 'swr';

export interface UseIncidentOptions {
  // SWR-specific options
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

export interface UseIncidentReturn {
  incident: OVRReportWithRelations | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  mutate: () => void;
}

/**
 * Hook to fetch and cache a single incident by ID
 * @example
 * const { incident, isLoading } = useIncident(123);
 */
export function useIncident(
  id: number | string | null | undefined,
  options: UseIncidentOptions = {}
): UseIncidentReturn {
  const {
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    refreshInterval = 0,
  } = options;

  const url = id ? `/api/incidents/${id}` : null;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<OVRReportWithRelations>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus,
    revalidateOnReconnect,
    refreshInterval,
    dedupingInterval: 2000,
  });

  return {
    incident: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
