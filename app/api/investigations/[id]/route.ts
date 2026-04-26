/**
 * @fileoverview Investigations API
 * 
 * Manage investigation lifecycle for OVR incidents
 * - QI creates investigations
 * - Investigators (via token) submit findings
 * - Access controlled via roles + shared access tokens
 */

import { db } from '@/db';
import { ovrInvestigations, ovrReports, ovrSharedAccess } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    NotFoundError,
    requireAuth,
    requireAuthOptional,
    ValidationError,
    validateBody,
} from '@/lib/api/middleware';
import {
    updateInvestigationSchema,
} from '@/lib/api/schemas';
import { canAccessInvestigation, getInvestigationSharedAccessGrant } from '@/lib/utils/data-access';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/investigations/[id] - Get investigation details
 * Access: QI roles OR shared access token
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const investigationId = parseInt(id);

        // Check if user can access this investigation
        const accessToken = request.nextUrl.searchParams.get('token');
        const session = accessToken
            ? await requireAuthOptional(request)
            : await requireAuth(request);

        const userContext = session
            ? {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            }
            : undefined;

        const hasAccess = await canAccessInvestigation(
            investigationId,
            userContext,
            accessToken || undefined
        );

        if (!hasAccess) {
            throw new NotFoundError('Investigation');
        }

        // Fetch investigation
        const [investigation] = await db
            .select()
            .from(ovrInvestigations)
            .where(eq(ovrInvestigations.id, investigationId))
            .limit(1);

        if (!investigation) {
            throw new NotFoundError('Investigation');
        }

        // Also fetch shared access list if user has permission
        let sharedAccess: any[] = [];
        if (session && ACCESS_CONTROL.api.investigations.canUpdate(session.user.roles, false)) {
            sharedAccess = await db
                .select()
                .from(ovrSharedAccess)
                .where(
                    and(
                        eq(ovrSharedAccess.resourceType, 'investigation'),
                        eq(ovrSharedAccess.resourceId, investigationId)
                    )
                );
        }

        return NextResponse.json({
            investigation,
            sharedAccess,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PATCH /api/investigations/[id] - Update investigation
 * Access: QI roles OR shared access with 'investigator' role
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const investigationId = parseInt(id);

        // Check access
        const accessToken = request.nextUrl.searchParams.get('token');
        const session = accessToken
            ? await requireAuthOptional(request)
            : await requireAuth(request);

        const userContext = session
            ? {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            }
            : undefined;

        const hasAccess = await canAccessInvestigation(
            investigationId,
            userContext,
            accessToken || undefined
        );

        if (!hasAccess) {
            throw new NotFoundError('Investigation');
        }

        const isPrivileged = Boolean(
            userContext &&
            ACCESS_CONTROL.api.investigations.canUpdate(userContext.roles, false)
        );

        if (!isPrivileged) {
            const grant = await getInvestigationSharedAccessGrant(
                investigationId,
                userContext,
                accessToken || undefined
            );

            if (!grant || grant.role !== 'investigator') {
                throw new AuthorizationError('Only investigator shared access can update this investigation');
            }
        }

        // Validate body
        const body = await validateBody(request, updateInvestigationSchema);

        const [existingInvestigation] = await db
            .select()
            .from(ovrInvestigations)
            .where(eq(ovrInvestigations.id, investigationId))
            .limit(1);

        if (!existingInvestigation) {
            throw new NotFoundError('Investigation');
        }

        if (existingInvestigation.submittedAt) {
            throw new ValidationError('Submitted investigations are read-only');
        }

        const [incident] = await db
            .select({ status: ovrReports.status })
            .from(ovrReports)
            .where(eq(ovrReports.id, existingInvestigation.ovrReportId))
            .limit(1);

        if (!incident) {
            throw new NotFoundError('Incident');
        }

        if (incident.status !== 'qi_review' && incident.status !== 'investigating') {
            throw new AuthorizationError(
                `Cannot update investigation while incident is in status: ${incident.status}`
            );
        }

        // Update investigation
        const [updated] = await db
            .update(ovrInvestigations)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(ovrInvestigations.id, investigationId))
            .returning();

        return NextResponse.json({
            success: true,
            investigation: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
