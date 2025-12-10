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

            canViewTeam: (roles: AppRole[]) =>
                hasAnyRole(roles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD]),

            canCreate: () => true, // All users can create incidents

            canEdit: (roles: AppRole[], isOwner: boolean, isDraft: boolean) =>
                (isDraft && isOwner) ||
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.QUALITY_MANAGER, APP_ROLES.DEVELOPER]),

            canDelete: (roles: AppRole[], isOwner: boolean, isDraft: boolean) =>
                (isDraft && isOwner) ||
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.QUALITY_MANAGER, APP_ROLES.DEVELOPER]),
        },

        /**
         * /api/incidents/[id]/qi-review permissions
         * QI reviews submitted incidents and approves/rejects
         */
        qiReview: {
            canReview: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/investigations permissions
         * QI creates and manages investigations
         */
        investigations: {
            canCreate: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canUpdate: (roles: AppRole[], hasAccess: boolean) =>
                hasAccess || // User has shared access via token
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canSubmit: (roles: AppRole[], hasAccess: boolean) =>
                hasAccess || // Investigator with token can submit
                hasAnyRole(roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.DEVELOPER]),

            canView: (roles: AppRole[], hasAccess: boolean) =>
                hasAccess ||
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/corrective-actions permissions
         * QI creates action items, handlers complete them
         */
        correctiveActions: {
            canCreate: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canUpdate: (roles: AppRole[], hasAccess: boolean) =>
                hasAccess || // Action handler with token
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canClose: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canView: (roles: AppRole[], hasAccess: boolean) =>
                hasAccess ||
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/shared-access permissions
         * QI manages shared access (Google Forms style)
         */
        sharedAccess: {
            canCreate: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canRevoke: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canViewAll: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * /api/incidents/[id]/close permissions
         * Final case closure by QI
         */
        closeIncident: {
            canClose: (roles: AppRole[], allActionsClosed: boolean) =>
                allActionsClosed &&
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
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

            /** Department management includes location management */
            showDepartmentManagement: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.TECH_ADMIN,
                    APP_ROLES.FACILITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            showAllIncidents: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.CEO,
                    APP_ROLES.EXECUTIVE,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.SUPERVISOR,
                    APP_ROLES.TEAM_LEAD,
                    APP_ROLES.DEVELOPER,
                ]),

            showQIReview: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            showInvestigations: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            showCorrectiveActions: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),
        },

        /**
         * Incident form section permissions
         */
        incidentForm: {
            canViewQIReviewSection: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canEditQISection: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canManageInvestigations: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canManageCorrectiveActions: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ]),

            canCloseCaseWithReview: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
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
