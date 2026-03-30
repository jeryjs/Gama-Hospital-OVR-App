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
} from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/corrective-actions - List corrective actions
 * Access: QI roles only (list view)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.correctiveActions.canView(session.user.roles, false)) {
            throw new AuthorizationError('Only authorized QI roles can view corrective actions');
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();
        const status = searchParams.get('status');
        const ovrReportId = searchParams.get('ovrReportId')?.trim();
        const overdueOnly = searchParams.get('overdueOnly') === 'true';

        const conditions: SQL[] = [];

        if (ovrReportId) {
            conditions.push(eq(ovrCorrectiveActions.ovrReportId, ovrReportId));
        }

        if (status === 'open' || status === 'closed') {
            conditions.push(eq(ovrCorrectiveActions.status, status));
        }

        if (overdueOnly) {
            conditions.push(eq(ovrCorrectiveActions.status, 'open'));
            conditions.push(sql`${ovrCorrectiveActions.dueDate} < NOW()`);
        }

        if (search) {
            conditions.push(
                or(
                    ilike(ovrCorrectiveActions.title, `%${search}%`),
                    ilike(ovrCorrectiveActions.description, `%${search}%`),
                    ilike(ovrCorrectiveActions.ovrReportId, `%${search}%`),
                    ilike(ovrReports.occurrenceCategory, `%${search}%`)
                )!
            );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db
            .select({
                id: ovrCorrectiveActions.id,
                ovrReportId: ovrCorrectiveActions.ovrReportId,
                title: ovrCorrectiveActions.title,
                description: ovrCorrectiveActions.description,
                dueDate: ovrCorrectiveActions.dueDate,
                assignedTo: ovrCorrectiveActions.assignedTo,
                status: ovrCorrectiveActions.status,
                checklist: ovrCorrectiveActions.checklist,
                actionTaken: ovrCorrectiveActions.actionTaken,
                evidenceFiles: ovrCorrectiveActions.evidenceFiles,
                createdBy: ovrCorrectiveActions.createdBy,
                createdAt: ovrCorrectiveActions.createdAt,
                updatedAt: ovrCorrectiveActions.updatedAt,
                completedAt: ovrCorrectiveActions.completedAt,
                handlerCount: sql<number>`COALESCE(array_length(${ovrCorrectiveActions.assignedTo}, 1), 0)::int`,
                incidentId: ovrReports.id,
                incidentCategory: ovrReports.occurrenceCategory,
            })
            .from(ovrCorrectiveActions)
            .leftJoin(ovrReports, eq(ovrCorrectiveActions.ovrReportId, ovrReports.id))
            .where(whereClause)
            .orderBy(desc(ovrCorrectiveActions.createdAt));

        const actions = rows.map((row) => ({
            id: row.id,
            ovrReportId: row.ovrReportId,
            investigationId: null,
            title: row.title,
            description: row.description,
            dueDate: row.dueDate,
            assignedTo: Array.isArray(row.assignedTo) ? row.assignedTo.join(',') : null,
            status: row.status,
            checklist: row.checklist,
            actionTaken: row.actionTaken,
            evidenceFiles: row.evidenceFiles,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            completedAt: row.completedAt,
            handlerCount: row.handlerCount,
            incident: row.incidentId
                ? {
                    id: row.incidentId,
                    occurrenceCategory: row.incidentCategory || undefined,
                }
                : undefined,
        }));

        return NextResponse.json({ actions });
    } catch (error) {
        return handleApiError(error);
    }
}

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

        // Verify incident exists and is in corrective action phase
        const incident = await getIncidentSecure(body.ovrReportId, {
            userId: parseInt(session.user.id),
            roles: session.user.roles,
            email: session.user.email,
        });

        if (incident.status !== 'qi_final_actions') {
            throw new AuthorizationError(
                `Cannot create corrective action for incident in status: ${incident.status}`
            );
        }

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

        await sendWorkflowMailSafely(request, session.user, 'corrective_action_created', {
            incidentId: body.ovrReportId,
            actionId: action.id,
            title: action.title,
            assigneeIds: action.assignedTo || [],
        });

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
