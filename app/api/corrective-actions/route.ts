/**
 * @fileoverview Corrective Actions API
 * 
 * Manage corrective action items for investigations
 * - QI creates action items
 * - Action handlers (via token) update and complete items
 * - Access controlled via roles + shared access tokens
 */

import { db } from '@/db';
import { ovrCorrectiveActions, ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import {
    createCorrectiveActionSchema,
    updateCorrectiveActionSchema,
} from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/corrective-actions - Create new corrective action
 * Access: QI roles only
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        // Check permissions - only QI can create actions
        if (!ACCESS_CONTROL.api.correctiveActions.canCreate(session.user.roles)) {
            throw new AuthorizationError(
                'Only QI staff can create corrective actions'
            );
        }

        // Validate body
        const body = await validateBody(request, createCorrectiveActionSchema);

        // Verify incident exists
        await getIncidentSecure(body.ovrReportId, {
            userId: parseInt(session.user.id),
            roles: session.user.roles,
            email: session.user.email,
        });

        // Create action
        const [action] = await db
            .insert(ovrCorrectiveActions)
            .values({
                ovrReportId: body.ovrReportId,
                title: body.title,
                description: body.description,
                dueDate: new Date(body.dueDate),
                assignedTo: body.assignedTo && body.assignedTo.length > 0
                    ? body.assignedTo
                    : [parseInt(session.user.id)],
                checklist: body.checklist,
                createdBy: parseInt(session.user.id),
            })
            .returning();

        return NextResponse.json(
            {
                success: true,
                message: 'Corrective action created successfully',
                action,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
