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
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

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

        if (incident.status !== 'investigating') {
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
