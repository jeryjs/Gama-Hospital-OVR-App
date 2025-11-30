/**
 * @fileoverview Centralized Access Control Configuration
 * 
 * Single source of truth for ALL permission checks throughout the application.
 * Define which roles can perform which actions in ONE place.
 * 
 * Usage:
 * - API routes: ACCESS_CONTROL.api.users.canView(session.user.roles)
 * - Components: ACCESS_CONTROL.ui.incidentForm.canEditSupervisorSection(session.user.roles)
 */

import { APP_ROLES, type AppRole } from './constants';
import { hasAnyRole, hasRole } from './auth-helpers';

// ============================================
// API ENDPOINT PERMISSIONS
// ============================================

export const ACCESS_CONTROL = {
    /**
     * API endpoint access control
     */
    api: {
        /**
         * /api/users permissions
         */
        users: {
            canView: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            canManage: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            canFilterByRole: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),
        },

        /**
         * /api/locations permissions
         */
        locations: {
            canView: () => true, // All authenticated users can view

            canCreate: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.TECH_ADMIN,
                    APP_ROLES.FACILITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canEdit: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.TECH_ADMIN,
                    APP_ROLES.FACILITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canDelete: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),
        },

        /**
         * /api/incidents permissions
         */
        incidents: {
            canViewAll: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.CEO,
                    APP_ROLES.EXECUTIVE,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canViewDepartment: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.DEPARTMENT_HEAD, APP_ROLES.ASSISTANT_DEPT_HEAD]),

            canViewTeam: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD]),

            canCreate: () => true, // All users can create incidents

            canDelete: (roles: AppRole[], isOwner: boolean, isDraft: boolean) =>
                (isDraft && isOwner) ||
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.QUALITY_MANAGER, APP_ROLES.DEVELOPER]),
        },

        /**
         * /api/incidents/[id]/supervisor-approve permissions
         */
        supervisorApproval: {
            canApprove: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.SUPERVISOR,
                    APP_ROLES.TEAM_LEAD,
                    APP_ROLES.DEPARTMENT_HEAD,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/incidents/[id]/qi-* permissions
         */
        qualityInspection: {
            canAssignHOD: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canCloseIncident: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.QUALITY_MANAGER, APP_ROLES.DEVELOPER]),

            canProvideFeedback: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/incidents/[id]/hod-submit permissions
         */
        hodInvestigation: {
            canSubmit: (roles: AppRole[], isAssignedHOD: boolean) =>
                isAssignedHOD ||
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.ASSISTANT_DEPT_HEAD,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/incidents/[id]/assign-investigator permissions
         */
        investigatorAssignment: {
            canAssign: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEPARTMENT_HEAD,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/stats permissions
         */
        stats: {
            canViewSystemStats: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            canViewExecutiveStats: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.CEO, APP_ROLES.EXECUTIVE]),

            canViewQIStats: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.QUALITY_MANAGER, APP_ROLES.QUALITY_ANALYST]),

            canViewDepartmentStats: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.DEPARTMENT_HEAD, APP_ROLES.ASSISTANT_DEPT_HEAD]),

            canViewTeamStats: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD]),
        },
    },

    /**
     * UI component permissions
     */
    ui: {
        /**
         * Navigation menu permissions
         */
        navigation: {
            showAdministration: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            showUserManagement: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            showSystemSettings: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN]),

            showLocationManagement: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.TECH_ADMIN,
                    APP_ROLES.FACILITY_MANAGER,
                ]),

            showQIReview: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            showHODReview: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.DEPARTMENT_HEAD,
                    APP_ROLES.ASSISTANT_DEPT_HEAD,
                    APP_ROLES.DEVELOPER,
                ]),

            showPendingApproval: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPERVISOR,
                    APP_ROLES.TEAM_LEAD,
                    APP_ROLES.DEPARTMENT_HEAD,
                    APP_ROLES.EMPLOYEE,
                ]),
        },

        /**
         * Incident form section permissions
         */
        incidentForm: {
            canEditSupervisorSection: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.SUPERVISOR,
                    APP_ROLES.TEAM_LEAD,
                    APP_ROLES.DEPARTMENT_HEAD,
                    APP_ROLES.DEVELOPER,
                ]),

            canEditQISection: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canEditInvestigationSection: (roles: AppRole[], isAssignedHOD: boolean) =>
                isAssignedHOD ||
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.ASSISTANT_DEPT_HEAD, APP_ROLES.DEVELOPER]),

            canAssignHOD: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * User management page permissions
         */
        userManagement: {
            canAccess: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            canEditRoles: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER]),

            canDeactivateUsers: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN]),
        },
    },
} as const;

/**
 * Helper to check if current user can perform an action
 * @example canPerform(session.user.roles, 'api', 'users', 'canView')
 */
export function canPerform(
    roles: AppRole[] | undefined,
    category: keyof typeof ACCESS_CONTROL,
    resource: string,
    action: string,
    ...args: any[]
): boolean {
    if (!roles || roles.length === 0) return false;

    const categoryObj = ACCESS_CONTROL[category] as any;
    if (!categoryObj) return false;

    const resourceObj = categoryObj[resource];
    if (!resourceObj) return false;

    const actionFn = resourceObj[action];
    if (typeof actionFn !== 'function') return false;

    return actionFn(roles, ...args);
}
