// ============================================
// SWR HOOKS - CLIENT-SIDE DATA FETCHING & CACHING
// ============================================
// All hooks use SWR for automatic caching, revalidation, and optimistic updates
// Single source of truth with /lib/api/schemas.ts types

export { useIncidents } from './useIncidents';
export { useIncident, useIncidentActions } from './useIncident';
export { useInvestigation } from './useInvestigation';
export { useInvestigations } from './useInvestigations';
export { useCorrectiveAction } from './useCorrectiveAction';
export { useCorrectiveActions } from './useCorrectiveActions';
export { useSharedAccess } from './useSharedAccess';
export { useComments } from './useComments';
export { useUsers } from './useUsers';
export { useLocations } from './useLocations';
export { useLocationManagement } from './useLocationManagement';
export { useDepartments, useDepartmentsWithLocations } from './useDepartments';
export { useDepartmentManagement } from './useDepartmentManagement';
export { useDashboardStats } from './useDashboardStats';
export { useUserManagement } from './useUserManagement';
export { useReportData, useIncidentTrends, useLocationComparison } from './useReportData';

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
    InvestigationListItem,
    UseInvestigationsParams,
    UseInvestigationsReturn,
} from './useInvestigations';
export type {
    CorrectiveAction,
    UseCorrectiveActionReturn,
} from './useCorrectiveAction';
export type {
    CorrectiveActionListItem,
    UseCorrectiveActionsParams,
    UseCorrectiveActionsReturn,
} from './useCorrectiveActions';
export type {
    SharedAccessInvitation,
    UseSharedAccessReturn,
} from './useSharedAccess';
export type { UseCommentsReturn } from './useComments';
export type { UseUsersOptions, UseUsersReturn } from './useUsers';
export type { UseLocationsReturn } from './useLocations';
export type { UseDashboardStatsReturn, DashboardStats } from './useDashboardStats';

// Location & Department management types (re-exported from schemas)
export type {
    Location,
    LocationCreate,
    LocationUpdate,
    Department,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentWithLocations,
} from '@/lib/api/schemas';

// User list management types
export type { User, UserListQuery, UserListResponse, UserUpdate } from '@/lib/api/schemas';

// Report data types
export type {
    DateRange as ReportDateRange,
    ReportFilters,
    ReportData,
    TrendDataPoint,
    StatusDistribution,
    LocationStats,
    DepartmentStats,
} from './useReportData';
