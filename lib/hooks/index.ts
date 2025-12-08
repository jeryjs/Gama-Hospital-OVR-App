// ============================================
// SWR HOOKS - CLIENT-SIDE DATA FETCHING & CACHING
// ============================================
// All hooks use SWR for automatic caching, revalidation, and optimistic updates
// Single source of truth with /lib/api/schemas.ts types

export { useIncidents } from './useIncidents';
export { useIncident, useIncidentActions } from './useIncident';
export { useComments } from './useComments';
export { useUsers } from './useUsers';
export { useLocations } from './useLocations';
export { useDashboardStats } from './useDashboardStats';
export { useUserManagement } from './useUserManagement';

// Re-export types for convenience
export type { UseIncidentsOptions, UseIncidentsReturn } from './useIncidents';
export type {
    UseIncidentOptions,
    UseIncidentReturn,
    IncidentActionType,
    ActionResult,
    UseIncidentActionsReturn,
} from './useIncident';
export type { UseCommentsReturn } from './useComments';
export type { UseUsersOptions, UseUsersReturn } from './useUsers';
export type { UseLocationsReturn } from './useLocations';
export type { UseDashboardStatsReturn, DashboardStats } from './useDashboardStats';

// User list management types
export type { User, UserListQuery, UserListResponse, UserUpdate } from '@/lib/api/schemas';
