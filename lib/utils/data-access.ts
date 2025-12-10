/**
 * @fileoverview Data Access Layer with Row-Level Security
 * 
 * Security-first database queries that enforce access control at DB level
 * NEVER rely on UI to hide data - filter at the source
 * 
 * Key Principles:
 * 1. Always apply WHERE clauses based on user permissions
 * 2. Return 404 instead of 403 to prevent information disclosure
 * 3. Use parameterized queries to prevent SQL injection
 * 4. Filter related data based on access rights
 */

import { db } from '@/db';
import {
    ovrReports,
    ovrInvestigations,
    ovrCorrectiveActions,
    ovrSharedAccess,
    users,
} from '@/db/schema';
import { and, eq, or, sql, inArray } from 'drizzle-orm';
import type { AppRole } from '@/lib/constants';
import { APP_ROLES } from '@/lib/constants';
import { hasAnyRole } from '@/lib/auth-helpers';
import { NotFoundError, AuthorizationError } from '@/lib/api/middleware';

/**
 * User context for access control
 */
export interface UserContext {
    userId: number;
    roles: AppRole[];
    email: string;
}

/**
 * Fetch users by IDs for populating investigators/assignees
 * Returns a map for efficient lookup
 * 
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId -> user object
 */
export async function getUsersByIds(userIds: number[]): Promise<Map<number, {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    department: string | null;
    profilePicture: string | null;
}>> {
    if (!userIds.length) return new Map();

    const fetchedUsers = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            department: users.department,
            profilePicture: users.profilePicture,
        })
        .from(users)
        .where(inArray(users.id, userIds));

    return new Map(fetchedUsers.map(u => [u.id, u]));
}

/**
 * Populate investigation with user details
 * Converts investigator IDs array to full user objects
 */
export async function populateInvestigationUsers<T extends { investigators: number[] | null }>(
    investigation: T
): Promise<T & {
    investigatorUsers: Array<{
        id: number;
        firstName: string | null;
        lastName: string | null;
        email: string;
        department: string | null;
        profilePicture: string | null;
    }>
}> {
    const userIds = investigation.investigators || [];
    const usersMap = await getUsersByIds(userIds);

    return {
        ...investigation,
        investigatorUsers: userIds
            .map(id => usersMap.get(id))
            .filter((u): u is NonNullable<typeof u> => u !== undefined),
    };
}

/**
 * Populate corrective action with user details
 * Converts assignedTo IDs array to full user objects
 */
export async function populateActionUsers<T extends { assignedTo: number[] | null }>(
    action: T
): Promise<T & {
    assigneeUsers: Array<{
        id: number;
        firstName: string | null;
        lastName: string | null;
        email: string;
        profilePicture: string | null;
    }>
}> {
    const userIds = action.assignedTo || [];
    const usersMap = await getUsersByIds(userIds);

    return {
        ...action,
        assigneeUsers: userIds
            .map(id => usersMap.get(id))
            .filter((u): u is NonNullable<typeof u> => u !== undefined)
            .map(({ department, ...rest }) => rest), // Exclude department for assignees
    };
}

/**
 * Build WHERE clause for incident visibility based on user roles
 * This is the SINGLE SOURCE OF TRUTH for who can see which incidents
 * 
 * CRITICAL BUSINESS RULES:
 * 1. Drafts are ALWAYS private - only the reporter can see their own drafts
 * 2. This filter is for the main /incidents list (not /incidents/me or /api/incidents/drafts)
 * 3. Elevated roles see submitted incidents but NEVER other users' drafts
 * 
 * @param userContext - Current user information
 * @param options - Additional options for filtering
 * @returns SQL condition for filtering incidents
 */
export function buildIncidentVisibilityFilter(
    userContext: UserContext,
    options: { includeDrafts?: boolean; myReportsOnly?: boolean } = {}
) {
    const { userId, roles } = userContext;
    const { includeDrafts = false, myReportsOnly = false } = options;

    // If requesting only user's own reports (for /incidents/me)
    if (myReportsOnly) {
        return eq(ovrReports.reporterId, userId);
    }

    // Super admins, QI, and executives see everything EXCEPT others' drafts
    if (hasAnyRole(roles, [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.DEVELOPER,
        APP_ROLES.CEO,
        APP_ROLES.EXECUTIVE,
        APP_ROLES.QUALITY_MANAGER,
        APP_ROLES.QUALITY_ANALYST,
    ])) {
        // Show all non-draft incidents OR user's own drafts (if includeDrafts is true)
        if (includeDrafts) {
            return or(
                sql`${ovrReports.status} != 'draft'`,
                eq(ovrReports.reporterId, userId)
            );
        }
        // Default: exclude all drafts from main incident list
        return sql`${ovrReports.status} != 'draft'`;
    }

    // Supervisors see their team's non-draft incidents + their own drafts (if includeDrafts)
    if (hasAnyRole(roles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD])) {
        if (includeDrafts) {
            return and(
                or(
                    eq(ovrReports.reporterId, userId),
                    eq(ovrReports.supervisorId, userId)
                ),
                or(
                    sql`${ovrReports.status} != 'draft'`,
                    eq(ovrReports.reporterId, userId)
                )
            );
        }
        // Default: team incidents excluding drafts (unless own)
        return and(
            or(
                eq(ovrReports.reporterId, userId),
                eq(ovrReports.supervisorId, userId)
            ),
            sql`${ovrReports.status} != 'draft'`
        );
    }

    // Employees only see their own non-draft reports (drafts via separate endpoint)
    if (includeDrafts) {
        return eq(ovrReports.reporterId, userId);
    }
    // Default: own reports excluding drafts
    return and(
        eq(ovrReports.reporterId, userId),
        sql`${ovrReports.status} != 'draft'`
    );
}

/**
 * Securely fetch a single incident with access control
 * 
 * IMPORTANT: This function separates "not found" from "no permission":
 * - If incident doesn't exist → throws NotFoundError (404)
 * - If incident exists but user has no permission → throws AuthorizationError (403)
 * 
 * @param incidentId - Incident ID
 * @param userContext - Current user
 * @returns Incident or throws NotFoundError/AuthorizationError
 */
export async function getIncidentSecure(
    incidentId: string,
    userContext: UserContext
) {
    // Step 1: Check if incident EXISTS (without permission check)
    const [existingIncident] = await db
        .select()
        .from(ovrReports)
        .where(eq(ovrReports.id, incidentId))
        .limit(1);

    // If incident doesn't exist at all, return 404
    if (!existingIncident) {
        throw new NotFoundError('Incident');
    }

    // Step 2: Check if user has permission to view this incident
    const visibilityFilter = buildIncidentVisibilityFilter(userContext);

    const whereConditions = visibilityFilter
        ? and(eq(ovrReports.id, incidentId), visibilityFilter)
        : eq(ovrReports.id, incidentId);

    const [accessibleIncident] = await db
        .select()
        .from(ovrReports)
        .where(whereConditions)
        .limit(1);

    // Incident exists but user doesn't have permission → 403
    if (!accessibleIncident) {
        throw new AuthorizationError('You do not have permission to view this incident');
    }

    return accessibleIncident;
}

/**
 * Check if user can access investigation
 * Either through roles OR through shared access token
 * 
 * @param investigationId - Investigation ID
 * @param userContext - Current user (optional if token provided)
 * @param accessToken - Shared access token (optional)
 * @returns true if access granted
 */
export async function canAccessInvestigation(
    investigationId: number,
    userContext?: UserContext,
    accessToken?: string
): Promise<boolean> {
    // Check role-based access
    if (userContext && hasAnyRole(userContext.roles, [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.DEVELOPER,
        APP_ROLES.QUALITY_MANAGER,
        APP_ROLES.QUALITY_ANALYST,
    ])) {
        return true;
    }

    // Check token-based access
    if (accessToken) {
        const [access] = await db
            .select()
            .from(ovrSharedAccess)
            .where(
                and(
                    eq(ovrSharedAccess.resourceType, 'investigation'),
                    eq(ovrSharedAccess.resourceId, investigationId),
                    eq(ovrSharedAccess.accessToken, accessToken),
                    eq(ovrSharedAccess.status, 'accepted'),
                    or(
                        sql`${ovrSharedAccess.tokenExpiresAt} IS NULL`,
                        sql`${ovrSharedAccess.tokenExpiresAt} > NOW()`
                    )
                )
            )
            .limit(1);

        if (access) {
            // Update last accessed timestamp
            await db
                .update(ovrSharedAccess)
                .set({ lastAccessedAt: new Date() })
                .where(eq(ovrSharedAccess.id, access.id));

            return true;
        }
    }

    // Check if user has shared access via email/userId
    if (userContext) {
        const [access] = await db
            .select()
            .from(ovrSharedAccess)
            .where(
                and(
                    eq(ovrSharedAccess.resourceType, 'investigation'),
                    eq(ovrSharedAccess.resourceId, investigationId),
                    or(
                        eq(ovrSharedAccess.userId, userContext.userId),
                        eq(ovrSharedAccess.email, userContext.email)
                    ),
                    eq(ovrSharedAccess.status, 'accepted'),
                    or(
                        sql`${ovrSharedAccess.tokenExpiresAt} IS NULL`,
                        sql`${ovrSharedAccess.tokenExpiresAt} > NOW()`
                    )
                )
            )
            .limit(1);

        return !!access;
    }

    return false;
}

/**
 * Check if user can access corrective action
 * Either through roles OR through shared access token
 */
export async function canAccessCorrectiveAction(
    actionId: number,
    userContext?: UserContext,
    accessToken?: string
): Promise<boolean> {
    // Check role-based access
    if (userContext && hasAnyRole(userContext.roles, [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.DEVELOPER,
        APP_ROLES.QUALITY_MANAGER,
        APP_ROLES.QUALITY_ANALYST,
    ])) {
        return true;
    }

    // Check token-based access
    if (accessToken) {
        const [access] = await db
            .select()
            .from(ovrSharedAccess)
            .where(
                and(
                    eq(ovrSharedAccess.resourceType, 'corrective_action'),
                    eq(ovrSharedAccess.resourceId, actionId),
                    eq(ovrSharedAccess.accessToken, accessToken),
                    eq(ovrSharedAccess.status, 'accepted'),
                    or(
                        sql`${ovrSharedAccess.tokenExpiresAt} IS NULL`,
                        sql`${ovrSharedAccess.tokenExpiresAt} > NOW()`
                    )
                )
            )
            .limit(1);

        if (access) {
            // Update last accessed timestamp
            await db
                .update(ovrSharedAccess)
                .set({ lastAccessedAt: new Date() })
                .where(eq(ovrSharedAccess.id, access.id));

            return true;
        }
    }

    // Check if user has shared access via email/userId
    if (userContext) {
        const [access] = await db
            .select()
            .from(ovrSharedAccess)
            .where(
                and(
                    eq(ovrSharedAccess.resourceType, 'corrective_action'),
                    eq(ovrSharedAccess.resourceId, actionId),
                    or(
                        eq(ovrSharedAccess.userId, userContext.userId),
                        eq(ovrSharedAccess.email, userContext.email)
                    ),
                    eq(ovrSharedAccess.status, 'accepted'),
                    or(
                        sql`${ovrSharedAccess.tokenExpiresAt} IS NULL`,
                        sql`${ovrSharedAccess.tokenExpiresAt} > NOW()`
                    )
                )
            )
            .limit(1);

        return !!access;
    }

    return false;
}

/**
 * Securely fetch investigation with access control
 * 
 * @param investigationId - Investigation ID
 * @param userContext - Current user (optional)
 * @param accessToken - Shared access token (optional)
 * @returns Investigation or throws NotFoundError
 */
export async function getInvestigationSecure(
    investigationId: number,
    userContext?: UserContext,
    accessToken?: string
) {
    const hasAccess = await canAccessInvestigation(investigationId, userContext, accessToken);

    if (!hasAccess) {
        throw new NotFoundError('Investigation'); // Return 404, not 403
    }

    const [investigation] = await db
        .select()
        .from(ovrInvestigations)
        .where(eq(ovrInvestigations.id, investigationId))
        .limit(1);

    if (!investigation) {
        throw new NotFoundError('Investigation');
    }

    return investigation;
}

/**
 * Securely fetch corrective action with access control
 */
export async function getCorrectiveActionSecure(
    actionId: number,
    userContext?: UserContext,
    accessToken?: string
) {
    const hasAccess = await canAccessCorrectiveAction(actionId, userContext, accessToken);

    if (!hasAccess) {
        throw new NotFoundError('Corrective Action'); // Return 404, not 403
    }

    const [action] = await db
        .select()
        .from(ovrCorrectiveActions)
        .where(eq(ovrCorrectiveActions.id, actionId))
        .limit(1);

    if (!action) {
        throw new NotFoundError('Corrective Action');
    }

    return action;
}

/**
 * Get all investigations user has access to for an incident
 * Automatically filters based on permissions
 */
export async function getInvestigationsForIncident(
    incidentId: string,
    userContext: UserContext
) {
    // First check if user can access the incident
    await getIncidentSecure(incidentId, userContext);

    // If we get here, user has access to the incident
    // Return all investigations for this incident
    return await db
        .select()
        .from(ovrInvestigations)
        .where(eq(ovrInvestigations.ovrReportId, incidentId));
}

/**
 * Get all corrective actions user has access to for an incident
 */
export async function getCorrectiveActionsForIncident(
    incidentId: string,
    userContext: UserContext
) {
    // First check if user can access the incident
    await getIncidentSecure(incidentId, userContext);

    // If we get here, user has access to the incident
    return await db
        .select()
        .from(ovrCorrectiveActions)
        .where(eq(ovrCorrectiveActions.ovrReportId, incidentId));
}

/**
 * Check if user can edit incident (own draft or QI role)
 */
export function canEditIncident(
    incident: { reporterId: number | null; status: string },
    userContext: UserContext
): boolean {
    // QI can always edit
    if (hasAnyRole(userContext.roles, [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.DEVELOPER,
        APP_ROLES.QUALITY_MANAGER,
    ])) {
        return true;
    }

    // Owner can edit if still in draft
    if (incident.reporterId === userContext.userId && incident.status === 'draft') {
        return true;
    }

    return false;
}
