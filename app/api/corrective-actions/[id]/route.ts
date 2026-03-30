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
    requireAuthOptional,
    ValidationError,
    validateBody,
} from '@/lib/api/middleware';
import { updateCorrectiveActionSchema } from '@/lib/api/schemas';
import { canAccessCorrectiveAction } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
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
        const { id } = await params;
        const actionId = parseInt(id);

        const accessToken = request.nextUrl.searchParams.get('token');
        const session = accessToken
            ? await requireAuthOptional(request)
            : await requireAuth(request);

        const hasAccess = await canAccessCorrectiveAction(
            actionId,
            session
                ? {
                    userId: parseInt(session.user.id),
                    roles: session.user.roles,
                    email: session.user.email,
                }
                : undefined,
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
        if (session && ACCESS_CONTROL.api.correctiveActions.canCreate(session.user.roles)) {
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
        const { id } = await params;
        const actionId = parseInt(id);

        const accessToken = request.nextUrl.searchParams.get('token');
        const session = accessToken
            ? await requireAuthOptional(request)
            : await requireAuth(request);

        const hasAccess = await canAccessCorrectiveAction(
            actionId,
            session
                ? {
                    userId: parseInt(session.user.id),
                    roles: session.user.roles,
                    email: session.user.email,
                }
                : undefined,
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
 * POST /api/corrective-actions/[id] - Close action item
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

        const body = await validateBody(request, updateCorrectiveActionSchema);

        const [existingAction] = await db
            .select()
            .from(ovrCorrectiveActions)
            .where(eq(ovrCorrectiveActions.id, actionId))
            .limit(1);

        if (!existingAction) {
            throw new NotFoundError('Corrective Action');
        }

        if (existingAction.status === 'closed') {
            throw new ValidationError('Corrective action is already closed');
        }

        const sanitizedUpdates = Object.fromEntries(
            Object.entries(body).filter(([, value]) => value !== undefined)
        ) as Record<string, string>;

        const finalChecklistRaw =
            typeof sanitizedUpdates.checklist === 'string'
                ? sanitizedUpdates.checklist
                : existingAction.checklist;

        let checklistItems: Array<{ completed?: boolean }> = [];
        try {
            checklistItems = finalChecklistRaw ? JSON.parse(finalChecklistRaw) : [];
        } catch {
            throw new ValidationError('Checklist must be valid JSON');
        }

        const checklistComplete =
            Array.isArray(checklistItems) &&
            checklistItems.length > 0 &&
            checklistItems.every((item) => item?.completed === true);

        if (!checklistComplete) {
            throw new ValidationError('All checklist items must be completed before closing');
        }

        const finalActionTaken = (
            typeof sanitizedUpdates.actionTaken === 'string'
                ? sanitizedUpdates.actionTaken
                : (existingAction.actionTaken || '')
        ).trim();

        const finalEvidenceRaw =
            typeof sanitizedUpdates.evidenceFiles === 'string'
                ? sanitizedUpdates.evidenceFiles
                : existingAction.evidenceFiles;

        let hasEvidence = false;
        if (typeof finalEvidenceRaw === 'string' && finalEvidenceRaw.trim().length > 0) {
            try {
                const parsedEvidence = JSON.parse(finalEvidenceRaw);
                hasEvidence = Array.isArray(parsedEvidence) && parsedEvidence.length > 0;
            } catch {
                hasEvidence = true;
            }
        }

        if (!finalActionTaken && !hasEvidence) {
            throw new ValidationError('Provide action details or at least one attachment before closing');
        }

        if (typeof sanitizedUpdates.actionTaken === 'string') {
            sanitizedUpdates.actionTaken = finalActionTaken;
        }

        const [updated] = await db
            .update(ovrCorrectiveActions)
            .set({
                ...sanitizedUpdates,
                status: 'closed',
                completedAt: new Date(),
                closedBy: parseInt(session.user.id),
                closedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(ovrCorrectiveActions.id, actionId))
            .returning();

        await sendWorkflowMailSafely(request, session.user, 'corrective_action_closed', {
            incidentId: updated.ovrReportId,
            actionId,
            title: updated.title,
        });

        return NextResponse.json({
            success: true,
            message: 'Corrective action closed successfully',
            action: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
