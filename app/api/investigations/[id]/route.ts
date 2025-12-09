/**
 * @fileoverview Investigations API
 * 
 * Manage investigation lifecycle for OVR incidents
 * - QI creates investigations
 * - Investigators (via token) submit findings
 * - Access controlled via roles + shared access tokens
 */

import { db } from '@/db';
import { ovrInvestigations, ovrSharedAccess } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    NotFoundError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import {
    createInvestigationSchema,
    updateInvestigationSchema,
    submitInvestigationSchema,
} from '@/lib/api/schemas';
import { getIncidentSecure, canAccessInvestigation } from '@/lib/utils';
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
        const session = await requireAuth(request);
        const { id } = await params;
        const investigationId = parseInt(id);

        // Check if user can access this investigation
        const accessToken = request.nextUrl.searchParams.get('token');
        const hasAccess = await canAccessInvestigation(
            investigationId,
            {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            },
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
        if (ACCESS_CONTROL.api.investigations.canCreate(session.user.roles)) {
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
        const session = await requireAuth(request);
        const { id } = await params;
        const investigationId = parseInt(id);

        // Check access
        const accessToken = request.nextUrl.searchParams.get('token');
        const hasAccess = await canAccessInvestigation(
            investigationId,
            {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            },
            accessToken || undefined
        );

        if (!hasAccess) {
            throw new NotFoundError('Investigation');
        }

        // Validate body
        const body = await validateBody(request, updateInvestigationSchema);

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
