/**
 * @fileoverview QI Review API - Approve or Reject Submitted Incidents
 * 
 * POST /api/incidents/[id]/qi-review
 * - QI reviews submitted incident
 * - Approves → Status changes to 'qi_review' for investigation setup
 * - Rejects → Status changes to 'qi_review' with rejection reason
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateCsrfAndIdempotency,
    validateBody,
} from '@/lib/api/middleware';
import { qiReviewSchema } from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await validateCsrfAndIdempotency(request);
        const { id } = await params;

        // Check permissions - only QI can review
        if (!ACCESS_CONTROL.api.qiReview.canReview(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can review incidents');
        }

        // Get incident
        const incident = await getIncidentSecure(id, {
            userId: parseInt(session.user.id),
            roles: session.user.roles,
            email: session.user.email,
        });

        // Validate status
        if (incident.status !== 'submitted') {
            throw new AuthorizationError(
                `Cannot review incident in status: ${incident.status}`
            );
        }

        // Validate request body
        const body = await validateBody(request, qiReviewSchema);

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
            qiReceivedBy: parseInt(session.user.id),
            qiReceivedDate: new Date(),
        };

        if (body.decision === 'approve') {
            // Approved - move to QI review stage
            updateData.status = 'qi_review';
            updateData.qiReviewedBy = parseInt(session.user.id);
            updateData.qiReviewedAt = new Date();
            updateData.qiAssignedBy = parseInt(session.user.id);
            updateData.qiAssignedDate = new Date();
            updateData.qiRejectionReason = null;
        } else {
            // Rejected - keep in QI review with rejection reason
            updateData.status = 'qi_review';
            updateData.qiRejectionReason = body.rejectionReason;
            updateData.qiReviewedBy = parseInt(session.user.id);
            updateData.qiReviewedAt = new Date();
        }

        const [updated] = await db
            .update(ovrReports)
            .set(updateData)
            .where(eq(ovrReports.id, id))
            .returning();

        await sendWorkflowMailSafely(request, session.user, 'incident_reviewed', {
            incidentId: id,
            decision: body.decision,
            rejectionReason: body.rejectionReason,
        });

        return NextResponse.json({
            success: true,
            message: body.decision === 'approve'
                ? 'Incident reviewed and moved to QI review queue'
                : 'Incident rejected with feedback',
            incident: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
