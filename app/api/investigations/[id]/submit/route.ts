/**
 * @fileoverview Submit Investigation API
 * 
 * POST /api/investigations/[id]/submit - Submit completed investigation
 * Validates required fields and marks investigation as submitted
 * Access: QI roles OR shared access with 'investigator' role
 */

import { db } from '@/db';
import { ovrInvestigations, ovrReports } from '@/db/schema';
import {
    handleApiError,
    NotFoundError,
    requireAuth,
    requireAuthOptional,
    validateBody,
} from '@/lib/api/middleware';
import { submitInvestigationSchema } from '@/lib/api/schemas';
import { canAccessInvestigation } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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

        const hasAccess = await canAccessInvestigation(
            investigationId,
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
            throw new NotFoundError('Investigation');
        }

        // Validate submission data
        const body = await validateBody(request, submitInvestigationSchema);

        // Update investigation with submitted data
        const [updated] = await db
            .update(ovrInvestigations)
            .set({
                findings: body.findings,
                problemsIdentified: body.problemsIdentified,
                causeClassification: body.causeClassification,
                causeDetails: body.causeDetails,
                submittedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(ovrInvestigations.id, investigationId))
            .returning();

        // Update incident status to qi_final_actions
        await db
            .update(ovrReports)
            .set({
                status: 'qi_final_actions',
                updatedAt: new Date(),
            })
            .where(eq(ovrReports.id, updated.ovrReportId));

        if (session) {
            await sendWorkflowMailSafely(request, session.user, 'investigation_submitted', {
                incidentId: updated.ovrReportId,
                investigationId,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Investigation submitted successfully',
            investigation: updated,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
