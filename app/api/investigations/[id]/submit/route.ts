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
import { canAccessInvestigation, getInvestigationSharedAccessGrant } from '@/lib/utils/data-access';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { APP_ROLES } from '@/lib/constants';
import { hasAnyRole } from '@/lib/auth-helpers';
import { and, eq, isNull } from 'drizzle-orm';
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

        // Validate submission data
        const body = await validateBody(request, submitInvestigationSchema);

        // Fetch investigation with incident details for validation and workflow processing
        const [investigationWithIncident] = await db
            .select({
                ovrReportId: ovrInvestigations.ovrReportId,
                submittedAt: ovrInvestigations.submittedAt,
                incidentStatus: ovrReports.status,
            })
            .from(ovrInvestigations)
            .innerJoin(ovrReports, eq(ovrReports.id, ovrInvestigations.ovrReportId))
            .where(eq(ovrInvestigations.id, investigationId))
            .limit(1);

        if (!investigationWithIncident) {
            throw new NotFoundError('Investigation');
        }

        if (investigationWithIncident.submittedAt) {
            throw new ValidationError('Investigation is already submitted');
        }

        if (
            investigationWithIncident.incidentStatus !== 'investigating' &&
            investigationWithIncident.incidentStatus !== 'qi_review' &&
            investigationWithIncident.incidentStatus !== 'qi_final_actions'
        ) {
            throw new AuthorizationError(
                `Cannot submit investigation while incident is in status: ${investigationWithIncident.incidentStatus}`
            );
        }

        // Update investigation as submitted and set findings
        const [updatedInvestigation] = await db
            .update(ovrInvestigations)
            .set({
                findings: body.findings,
                problemsIdentified: body.problemsIdentified,
                causeClassification: body.causeClassification,
                causeDetails: body.causeDetails,
                submittedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(ovrInvestigations.id, investigationId),
                    isNull(ovrInvestigations.submittedAt)
                )
            )
            .returning();

        if (!updatedInvestigation) {
            throw new ValidationError('Investigation state changed. Please refresh and try again.');
        }

        // Check if there are any remaining open investigations for the incident
        const [remainingOpenInvestigation] = await db
            .select({ id: ovrInvestigations.id })
            .from(ovrInvestigations)
            .where(
                and(
                    eq(ovrInvestigations.ovrReportId, investigationWithIncident.ovrReportId),
                    isNull(ovrInvestigations.submittedAt)
                )
            )
            .limit(1);

        const nextIncidentStatus = remainingOpenInvestigation ? 'investigating' : 'qi_final_actions';

        // Skip DB write if status already matches target
        if (investigationWithIncident.incidentStatus !== nextIncidentStatus) {
            await db
                .update(ovrReports)
                .set({
                    status: nextIncidentStatus,
                    updatedAt: new Date(),
                })
                .where(eq(ovrReports.id, investigationWithIncident.ovrReportId));
        }

        const workflowResult = {
            investigation: updatedInvestigation,
            incidentId: investigationWithIncident.ovrReportId,
        };

        if (session) {
            // Dont await to send email - if it fails we still want to return success response for the investigation submission
            sendWorkflowMailSafely(request, session.user, 'investigation_submitted', {
                incidentId: workflowResult.incidentId,
                investigationId,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Investigation submitted successfully',
            investigation: workflowResult.investigation,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
