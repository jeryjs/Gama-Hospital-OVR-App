/**
 * @fileoverview QI Review API - Approve or Reject Submitted Incidents
 * 
 * POST /api/incidents/[id]/qi-review
 * - QI reviews submitted incident
 * - Approves → Status changes to 'investigating'
 * - Rejects → Status changes back to 'draft' with rejection reason
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import { qiReviewSchema } from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth(request);
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

        if (body.approved) {
            // Approved - move to investigating status
            updateData.status = 'investigating';
            updateData.qiApprovedBy = parseInt(session.user.id);
            updateData.qiApprovedAt = new Date();
            updateData.qiAssignedBy = parseInt(session.user.id);
            updateData.qiAssignedDate = new Date();
        } else {
            // Rejected - send back to draft with reason
            updateData.status = 'draft';
            updateData.qiRejectionReason = body.rejectionReason;
            updateData.submittedAt = null; // Clear submission timestamp
        }

        const [updated] = await db
            .update(ovrReports)
            .set(updateData)
            .where(eq(ovrReports.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            message: body.approved
                ? 'Incident approved and moved to investigation'
                : 'Incident rejected and returned to reporter',
            incident: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
