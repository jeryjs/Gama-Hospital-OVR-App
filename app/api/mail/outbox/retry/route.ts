import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { processMailOutboxForActor } from '@/lib/utils/mail';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mail/outbox/retry
 * Process pending mail retries for the currently signed-in actor.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        const result = await processMailOutboxForActor(request, session.user, 25);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
