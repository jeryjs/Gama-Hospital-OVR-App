/**
 * @fileoverview Create Investigation API
 * 
 * POST /api/investigations - Create new investigation for incident
 * Access: QI roles only
 */

import { db } from '@/db';
import { ovrInvestigations, ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import { createInvestigationSchema } from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { and, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/investigations - List investigations
 * Access: QI roles only (list view)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.investigations.canView(session.user.roles, false)) {
            throw new AuthorizationError('Only authorized QI roles can view investigations');
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const status = searchParams.get('status');
        const ovrReportId = searchParams.get('ovrReportId')?.trim();

        const conditions: SQL[] = [];

        if (ovrReportId) {
            conditions.push(eq(ovrInvestigations.ovrReportId, ovrReportId));
        }

        if (status === 'pending') {
            conditions.push(isNull(ovrInvestigations.submittedAt));
        } else if (status === 'completed') {
            conditions.push(isNotNull(ovrInvestigations.submittedAt));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(ovrInvestigations.ovrReportId, `%${search}%`),
                    ilike(ovrInvestigations.causeClassification, `%${search}%`),
                    ilike(ovrInvestigations.findings, `%${search}%`),
                    ilike(ovrReports.occurrenceCategory, `%${search}%`)
                )!
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db
            .select({
                id: ovrInvestigations.id,
                ovrReportId: ovrInvestigations.ovrReportId,
                investigators: ovrInvestigations.investigators,
                accessToken: sql<string | null>`NULL`,
                tokenExpiresAt: sql<Date | null>`NULL`,
                findings: ovrInvestigations.findings,
                problemsIdentified: ovrInvestigations.problemsIdentified,
                causeClassification: ovrInvestigations.causeClassification,
                causeDetails: ovrInvestigations.causeDetails,
                correctiveActionPlan: ovrInvestigations.correctiveActionPlan,
                rcaAnalysis: ovrInvestigations.rcaAnalysis,
                fishboneAnalysis: ovrInvestigations.fishboneAnalysis,
                createdBy: ovrInvestigations.createdBy,
                createdAt: ovrInvestigations.createdAt,
                updatedAt: ovrInvestigations.updatedAt,
                submittedAt: ovrInvestigations.submittedAt,
                investigatorCount: sql<number>`COALESCE(array_length(${ovrInvestigations.investigators}, 1), 0)::int`,
                incidentId: ovrReports.id,
                incidentCategory: ovrReports.occurrenceCategory,
            })
            .from(ovrInvestigations)
            .leftJoin(ovrReports, eq(ovrInvestigations.ovrReportId, ovrReports.id))
            .where(whereClause)
            .orderBy(desc(ovrInvestigations.createdAt));

        const investigations = rows.map((row) => ({
            id: row.id,
            ovrReportId: row.ovrReportId,
            investigators: row.investigators,
            accessToken: row.accessToken,
            tokenExpiresAt: row.tokenExpiresAt,
            findings: row.findings,
            problemsIdentified: row.problemsIdentified,
            causeClassification: row.causeClassification,
            causeDetails: row.causeDetails,
            correctiveActionPlan: row.correctiveActionPlan,
            rcaAnalysis: row.rcaAnalysis,
            fishboneAnalysis: row.fishboneAnalysis,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            submittedAt: row.submittedAt,
            investigatorCount: row.investigatorCount,
            incident: row.incidentId
                ? {
                    id: row.incidentId,
                    occurrenceCategory: row.incidentCategory || undefined,
                }
                : undefined,
        }));

        return NextResponse.json({ investigations });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        // Check permissions - only QI can create investigations
        if (!ACCESS_CONTROL.api.investigations.canCreate(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can create investigations');
        }

        // Validate body
        const body = await validateBody(request, createInvestigationSchema);

        // Verify incident exists and is in correct status
        const incident = await getIncidentSecure(body.ovrReportId, {
            userId: parseInt(session.user.id),
            roles: session.user.roles,
            email: session.user.email,
        });

        if (incident.status !== 'investigating' && incident.status !== 'qi_review') {
            throw new AuthorizationError(
                `Cannot create investigation for incident in status: ${incident.status}`
            );
        }

        // Create investigation
        const [investigation] = await db
            .insert(ovrInvestigations)
            .values({
                ovrReportId: body.ovrReportId,
                investigators: body.investigators && body.investigators.length > 0
                    ? body.investigators
                    : [parseInt(session.user.id)],
                createdBy: parseInt(session.user.id),
            })
            .returning();

        await sendWorkflowMailSafely(request, session.user, 'investigation_created', {
            incidentId: body.ovrReportId,
            investigationId: investigation.id,
            investigatorIds: investigation.investigators || [],
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Investigation created successfully',
                investigation,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
