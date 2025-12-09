import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import type { IncidentListQuery, OVRReportListItem, PaginationMeta } from '@/lib/types';
import useSWR from 'swr';

export interface UseIncidentsOptions extends Partial<IncidentListQuery> {
  // SWR-specific options
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

export interface UseIncidentsReturn {
  incidents: OVRReportListItem[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: ParsedError | undefined;
  mutate: () => void;
}

/**
 * Hook to fetch and cache paginated incidents list
 * @example
 * const { incidents, pagination, isLoading } = useIncidents({
 *   page: 1,
 *   limit: 20,
 *   status: 'submitted'
 * });
 */
export function useIncidents(options: UseIncidentsOptions = {}): UseIncidentsReturn {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    category,
    reporterId,
    supervisorId,
    dateFrom,
    dateTo,
    search,
    fields,
    revalidateOnFocus = true,
    refreshInterval = 0,
  } = options;

  // Build query string
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  if (status) params.append('status', status);
  if (category) params.append('category', category);
  if (reporterId) params.append('reporterId', reporterId.toString());
  if (supervisorId) params.append('supervisorId', supervisorId.toString());
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  if (search) params.append('search', search);
  if (fields) params.append('fields', fields);

  const url = `/api/incidents?${params.toString()}`;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<{
      data: OVRReportListItem[];
      pagination: PaginationMeta;
    }>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus,
    refreshInterval,
    dedupingInterval: 2000, // Dedupe requests within 2 seconds
    suspense: false,
  });

  return {
    incidents: data?.data || [],
    pagination: data?.pagination || null,
    isLoading,
    error,
    mutate,
  };
}
