// ============================================
// SWR HOOKS - CLIENT-SIDE DATA FETCHING & CACHING
// ============================================
// All hooks use SWR for automatic caching, revalidation, and optimistic updates
// Single source of truth with /lib/api/schemas.ts types

export { useIncidents } from './useIncidents';
export { useIncident, useIncidentActions } from './useIncident';
export { useInvestigation } from './useInvestigation';
export { useCorrectiveAction } from './useCorrectiveAction';
export { useSharedAccess } from './useSharedAccess';
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
export type {
    Investigation,
    SharedAccessInfo,
    UseInvestigationReturn,
} from './useInvestigation';
export type {
    CorrectiveAction,
    UseCorrectiveActionReturn,
} from './useCorrectiveAction';
export type {
    SharedAccessInvitation,
    UseSharedAccessReturn,
} from './useSharedAccess';
export type { UseCommentsReturn } from './useComments';
export type { UseUsersOptions, UseUsersReturn } from './useUsers';
export type { UseLocationsReturn } from './useLocations';
export type { UseDashboardStatsReturn, DashboardStats } from './useDashboardStats';

// User list management types
export type { User, UserListQuery, UserListResponse, UserUpdate } from '@/lib/api/schemas';
