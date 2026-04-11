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
    AuthorizationError,
    handleApiError,
    NotFoundError,
    requireAuth,
    requireAuthOptional,
    ValidationError,
    validateBody,
} from '@/lib/api/middleware';
import { submitInvestigationSchema } from '@/lib/api/schemas';
import { canAccessInvestigation, getInvestigationSharedAccessGrant } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { APP_ROLES } from '@/lib/constants';
import { hasAnyRole } from '@/lib/auth-helpers';
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
            hasAnyRole(userContext.roles, [
                APP_ROLES.SUPER_ADMIN,
                APP_ROLES.DEVELOPER,
                APP_ROLES.QUALITY_MANAGER,
                APP_ROLES.QUALITY_ANALYST,
            ])
        );

        if (!isPrivileged) {
            const grant = await getInvestigationSharedAccessGrant(
                investigationId,
                userContext,
                accessToken || undefined
            );

            if (!grant || grant.role !== 'investigator') {
                throw new AuthorizationError('Only investigator shared access can submit this investigation');
            }
        }

        const [existingInvestigation] = await db
            .select()
            .from(ovrInvestigations)
            .where(eq(ovrInvestigations.id, investigationId))
            .limit(1);

        if (!existingInvestigation) {
            throw new NotFoundError('Investigation');
        }

        if (existingInvestigation.submittedAt) {
            throw new ValidationError('Investigation is already submitted');
        }

        const [incident] = await db
            .select({ status: ovrReports.status })
            .from(ovrReports)
            .where(eq(ovrReports.id, existingInvestigation.ovrReportId))
            .limit(1);

        if (!incident) {
            throw new NotFoundError('Incident');
        }

        if (incident.status !== 'investigating' && incident.status !== 'qi_review') {
            throw new AuthorizationError(
                `Cannot submit investigation while incident is in status: ${incident.status}`
            );
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
            .where(eq(ovrReports.id, existingInvestigation.ovrReportId));

        if (session) {
            await sendWorkflowMailSafely(request, session.user, 'investigation_submitted', {
                incidentId: existingInvestigation.ovrReportId,
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
