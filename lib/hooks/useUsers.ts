import { apiCall } from '@/lib/client/error-handler';
import type { UserSearchResult } from '@/lib/api/schemas';
import useSWR from 'swr';

export interface UseUsersOptions {
  /** Filter by roles (comma-separated or array) */
  roles?: string | string[];
  /** Search query (optional - if not provided, returns all active users) */
  search?: string;
  /** Limit results */
  limit?: number;
  /** Fetch all active users (when true, ignores search requirement) */
  fetchAll?: boolean;
}

export interface UseUsersReturn {
  users: UserSearchResult[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Hook to fetch and cache users list (e.g., for dropdowns)
 * Uses the optimized /api/users/search endpoint
 * 
 * @example
 * // Search users
 * const { users, isLoading } = useUsers({ search: 'john', roles: 'supervisor' });
 * 
 * @example
 * // Fetch all active users for dropdowns
 * const { users } = useUsers({ fetchAll: true });
 */
export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { roles, search, limit = 50, fetchAll = false } = options;

  const params = new URLSearchParams();

  // For fetchAll mode, use a wildcard to get all users
  // For search mode, require a search query
  if (search) {
    params.append('q', search);
  } else if (fetchAll) {
    // Use a minimal search pattern to get all users
    params.append('q', '');
  }

  params.append('limit', String(limit));

  if (roles) {
    const rolesStr = Array.isArray(roles) ? roles.join(',') : roles;
    params.append('roles', rolesStr);
  }

  // Only fetch if we have a search query or fetchAll is true
  const shouldFetch = search || fetchAll;
  const url = shouldFetch ? `/api/users/search?${params.toString()}` : null;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<UserSearchResult[]>(url);

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
    error: error || null,
    mutate,
  };
}
