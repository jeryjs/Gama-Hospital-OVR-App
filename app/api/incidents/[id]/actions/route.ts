/**
 * Unified Actions Endpoint
 * Single endpoint for all incident workflow actions
 * 
 * POST /api/incidents/[id]/actions
 * 
 * Replaces 6 separate action endpoints with one modular handler
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import {
    handleApiError,
    NotFoundError,
    requireAuth,
    ValidationError,
} from '@/lib/api/middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { actionPayloadSchema, validateActionData } from './types';
import { validateActionPermission } from './permissions';
import { getActionHandler } from './handlers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Authenticate user
        const session = await requireAuth(request);
        const { id } = await params;

        // 2. Parse and validate action payload
        const body = await request.json();
        const payload = actionPayloadSchema.parse(body);

        // 3. Fetch incident (single DB query)
        const incident = await db.query.ovrReports.findFirst({
            where: eq(ovrReports.id, parseInt(id)),
            with: {
                investigators: {
                    with: {
                        investigator: true,
                    },
                },
            },
        });

        if (!incident) {
            throw new NotFoundError('Incident');
        }

        // 4. Validate permissions (checks role + status)
        validateActionPermission(session, incident, payload.action);

        // 5. Validate action-specific data
        const validatedData = validateActionData(payload.action, payload.data);

        // 6. Execute action handler
        const handler = getActionHandler(payload.action);
        const result = await handler(incident, validatedData, session);

        // 7. Return result
        return NextResponse.json(result);
    } catch (error) {
        // Centralized error handling
        return handleApiError(error);
    }
}
