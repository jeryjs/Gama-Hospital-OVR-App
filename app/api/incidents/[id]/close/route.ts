/**
 * @fileoverview Close Incident API
 * 
 * POST /api/incidents/[id]/close - Final case closure by QI
 * Requires all corrective actions to be closed first
 * Records case review and reporter feedback
 */

import { db } from '@/db';
import { ovrReports, ovrCorrectiveActions } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import { closeIncidentSchema } from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth(request);
        const { id } = await params;

        // Get incident with security check
        const incident = await getIncidentSecure(id, {
            userId: parseInt(session.user.id),
            roles: session.user.roles,
            email: session.user.email,
        });

        // Validate body
        const body = await validateBody(request, closeIncidentSchema);

        // Check if all corrective actions are closed
        const openActions = await db
            .select()
            .from(ovrCorrectiveActions)
            .where(
                and(
                    eq(ovrCorrectiveActions.ovrReportId, id),
                    eq(ovrCorrectiveActions.status, 'open')
                )
            );

        const [{ totalActions }] = await db
            .select({ totalActions: sql<number>`COUNT(*)::int` })
            .from(ovrCorrectiveActions)
            .where(eq(ovrCorrectiveActions.ovrReportId, id));

        const hasActions = totalActions > 0;
        const allActionsClosed = hasActions && openActions.length === 0;

        // Check permissions - can close if all actions are done
        if (
            !ACCESS_CONTROL.api.closeIncident.canClose(
                session.user.roles,
                allActionsClosed
            )
        ) {
            if (!hasActions) {
                throw new AuthorizationError(
                    'Cannot close incident: at least one corrective action is required'
                );
            }
            if (!allActionsClosed) {
                throw new AuthorizationError(
                    `Cannot close incident: ${openActions.length} corrective action(s) still open`
                );
            }
            throw new AuthorizationError('Only QI staff can close incidents');
        }

        // Validate status
        if (incident.status !== 'qi_final_actions') {
            throw new AuthorizationError(
                `Cannot close incident in status: ${incident.status}`
            );
        }

        // Close incident
        const [updated] = await db
            .update(ovrReports)
            .set({
                status: 'closed',
                caseReview: body.caseReview,
                reporterFeedback: body.reporterFeedback,
                closedBy: parseInt(session.user.id),
                closedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(ovrReports.id, id))
            .returning();

        await sendWorkflowMailSafely(request, session.user, 'incident_closed', {
            incidentId: id,
        });

        return NextResponse.json({
            success: true,
            message: 'Incident closed successfully',
            incident: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
