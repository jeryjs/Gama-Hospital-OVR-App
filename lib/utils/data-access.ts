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
 * Build WHERE clause for incident visibility based on user roles
 * This is the SINGLE SOURCE OF TRUTH for who can see which incidents
 * 
 * @param userContext - Current user information
 * @returns SQL condition for filtering incidents
 */
export function buildIncidentVisibilityFilter(userContext: UserContext) {
    const { userId, roles } = userContext;

    // Super admins, QI, and executives see everything
    if (hasAnyRole(roles, [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.DEVELOPER,
        APP_ROLES.CEO,
        APP_ROLES.EXECUTIVE,
        APP_ROLES.QUALITY_MANAGER,
        APP_ROLES.QUALITY_ANALYST,
    ])) {
        return undefined; // No filter = see all
    }

    // Supervisors see their team's incidents
    if (hasAnyRole(roles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD])) {
        return or(
            eq(ovrReports.reporterId, userId),
            eq(ovrReports.supervisorId, userId)
        );
    }

    // Everyone else only sees their own reports
    return eq(ovrReports.reporterId, userId);
}

/**
 * Securely fetch a single incident with access control
 * Returns 404 if not found OR if user doesn't have access (no information leak)
 * 
 * @param incidentId - Incident ID
 * @param userContext - Current user
 * @returns Incident or throws NotFoundError
 */
export async function getIncidentSecure(
    incidentId: string,
    userContext: UserContext
) {
    const visibilityFilter = buildIncidentVisibilityFilter(userContext);

    const whereConditions = visibilityFilter
        ? and(eq(ovrReports.id, incidentId), visibilityFilter)
        : eq(ovrReports.id, incidentId);

    const [incident] = await db
        .select()
        .from(ovrReports)
        .where(whereConditions)
        .limit(1);

    if (!incident) {
        throw new NotFoundError('Incident');
    }

    return incident;
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
