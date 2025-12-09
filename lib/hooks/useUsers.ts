import { apiCall } from '@/lib/client/error-handler';
import type { UserMinimal } from '@/lib/types';
import useSWR from 'swr';

export interface UseUsersOptions {
  role?: string;
}

export interface UseUsersReturn {
  users: UserMinimal[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

/**
 * Hook to fetch and cache users list (e.g., for dropdowns)
 * @example
 * const { users, isLoading } = useUsers({ role: 'department_head' });
 */
export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { role } = options;

  const params = new URLSearchParams();
  params.append('legacy', 'true'); // Use legacy endpoint for dropdowns
  if (role) params.append('role', role);

  const url = `/api/users?${params.toString()}`;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<UserMinimal[]>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute - users don't change often
    suspense: false,
  });

  return {
    users: data || [],
    isLoading,
    error,
    mutate,
  };
}
