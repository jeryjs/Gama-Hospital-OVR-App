import useSWR from 'swr';
import type { Location } from '@/lib/types';
import { apiCall } from '@/lib/client/error-handler';

export interface UseLocationsReturn {
  locations: Location[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  mutate: () => void;
}

/**
 * Hook to fetch and cache locations list
 * Cached for longer since locations rarely change
 * @example
 * const { locations, isLoading } = useLocations();
 */
export function useLocations(): UseLocationsReturn {
  const url = '/api/locations';

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<Location[]>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes - locations rarely change
  });

  return {
    locations: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
