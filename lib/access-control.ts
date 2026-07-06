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
                ACCESS_CONTROL.ui.navigation.showUserManagement(roles) ||
                ACCESS_CONTROL.ui.navigation.showSystemSettings(roles) ||
                ACCESS_CONTROL.ui.navigation.showDepartmentManagement(roles),

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
                ACCESS_CONTROL.api.incidents.canViewAll(roles) ||
                ACCESS_CONTROL.api.incidents.canViewTeam(roles),

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

            canViewInvestigations: (roles: AppRole[], hasAccess) =>
                hasAccess ||
                hasAnyRole(roles, [APP_ROLES.QUALITY_ANALYST]) ||
                ACCESS_CONTROL.ui.incidentForm.canManageInvestigations(roles),

            canManageInvestigations: (roles: AppRole[]) =>
                hasAnyRole(roles, [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.DEVELOPER,
                ]),

            canViewCorrectiveActions: (roles: AppRole[], hasAccess) =>
                hasAccess ||
                hasAnyRole(roles, [APP_ROLES.QUALITY_ANALYST]) ||
                ACCESS_CONTROL.ui.incidentForm.canManageCorrectiveActions(roles),

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

    /**
     * Notification category definitions — single source of truth.
     *
     * `allUsers: true`  → shown to every authenticated user (they receive this as reporter/assignee/invitee).
     * `eligibleRoles`   → additional role-based gate; shown even if user is not directly involved.
     *
     * Used by:
     *  - /profile page  → visibleCategories(roles) determines which rows to render
     *  - notifications.ts createHistoryEntries → filters recipients by inApp preference
     */
    notifications: {
        categories: [
            {
                event: 'incident_submitted' as const,
                label: 'New Incident Submitted',
                description: 'When a new incident report is submitted and awaiting QI review',
                eligibleRoles: [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ] as AppRole[],
            },
            {
                event: 'incident_reviewed' as const,
                label: 'Incident Reviewed',
                description: 'When QI approves or returns your submitted incident',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
            {
                event: 'investigation_created' as const,
                label: 'Investigation Assigned',
                description: 'When you are assigned to carry out an investigation',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
            {
                event: 'investigation_submitted' as const,
                label: 'Investigation Submitted',
                description: 'When an investigation is submitted for QI review',
                eligibleRoles: [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ] as AppRole[],
                allUsers: true, // reporter also receives this
            },
            {
                event: 'corrective_action_created' as const,
                label: 'Corrective Action Assigned',
                description: 'When a corrective action is assigned to you',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
            {
                event: 'corrective_action_closed' as const,
                label: 'Corrective Action Closed',
                description: 'When a corrective action tied to your incident is closed',
                eligibleRoles: [
                    APP_ROLES.SUPER_ADMIN,
                    APP_ROLES.QUALITY_MANAGER,
                    APP_ROLES.QUALITY_ANALYST,
                    APP_ROLES.DEVELOPER,
                ] as AppRole[],
                allUsers: true, // reporter also receives this
            },
            {
                event: 'incident_closed' as const,
                label: 'Incident Closed',
                description: 'When your incident is fully closed by QI',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
            {
                event: 'incident_commented' as const,
                label: 'New Comment on Incident',
                description: 'When someone comments on an incident you are involved in',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
            {
                event: 'shared_access_invited' as const,
                label: 'Shared Access Invitation',
                description: 'When you are invited as investigator, action handler, or viewer',
                allUsers: true,
                eligibleRoles: [] as AppRole[],
            },
        ],

        /** Returns only the categories visible/relevant to the given roles. */
        visibleCategories(roles: AppRole[]) {
            return ACCESS_CONTROL.notifications.categories.filter(
                (c) => c.allUsers || hasAnyRole(roles, c.eligibleRoles)
            );
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
