/**
 * @fileoverview Corrective Action Detail API
 * 
 * GET/PATCH/POST /api/corrective-actions/[id]
 */

import { db } from '@/db';
import { ovrCorrectiveActions, ovrSharedAccess } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    NotFoundError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import { updateCorrectiveActionSchema } from '@/lib/api/schemas';
import { canAccessCorrectiveAction } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/corrective-actions/[id] - Get action details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth(request);
        const { id } = await params;
        const actionId = parseInt(id);

        const accessToken = request.nextUrl.searchParams.get('token');
        const hasAccess = await canAccessCorrectiveAction(
            actionId,
            {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            },
            accessToken || undefined
        );

        if (!hasAccess) {
            throw new NotFoundError('Corrective Action');
        }

        const [action] = await db
            .select()
            .from(ovrCorrectiveActions)
            .where(eq(ovrCorrectiveActions.id, actionId))
            .limit(1);

        if (!action) {
            throw new NotFoundError('Corrective Action');
        }

        // Fetch shared access list if user has permission
        let sharedAccess: any[] = [];
        if (ACCESS_CONTROL.api.correctiveActions.canCreate(session.user.roles)) {
            sharedAccess = await db
                .select()
                .from(ovrSharedAccess)
                .where(
                    and(
                        eq(ovrSharedAccess.resourceType, 'corrective_action'),
                        eq(ovrSharedAccess.resourceId, actionId)
                    )
                );
        }

        return NextResponse.json({
            action,
            sharedAccess,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PATCH /api/corrective-actions/[id] - Update action
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth(request);
        const { id } = await params;
        const actionId = parseInt(id);

        const accessToken = request.nextUrl.searchParams.get('token');
        const hasAccess = await canAccessCorrectiveAction(
            actionId,
            {
                userId: parseInt(session.user.id),
                roles: session.user.roles,
                email: session.user.email,
            },
            accessToken || undefined
        );

        if (!hasAccess) {
            throw new NotFoundError('Corrective Action');
        }

        const body = await validateBody(request, updateCorrectiveActionSchema);

        const [updated] = await db
            .update(ovrCorrectiveActions)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(ovrCorrectiveActions.id, actionId))
            .returning();

        return NextResponse.json({
            success: true,
            action: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/corrective-actions/[id]/close - Close action item
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth(request);
        const { id } = await params;
        const actionId = parseInt(id);

        // Only QI can close actions
        if (!ACCESS_CONTROL.api.correctiveActions.canClose(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can close corrective actions');
        }

        const [updated] = await db
            .update(ovrCorrectiveActions)
            .set({
                status: 'closed',
                closedBy: parseInt(session.user.id),
                closedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(ovrCorrectiveActions.id, actionId))
            .returning();

        return NextResponse.json({
            success: true,
            message: 'Corrective action closed successfully',
            action: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
