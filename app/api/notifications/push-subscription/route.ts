import { handleApiError, requireAuth, validateCsrfAndIdempotency } from '@/lib/api/middleware';
import { getWebPushPublicKey, upsertPushSubscription } from '@/lib/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const pushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
});

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);

        return NextResponse.json({ publicKey: getWebPushPublicKey() });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await validateCsrfAndIdempotency(request);
        const payload = pushSubscriptionSchema.parse(await request.json());

        await upsertPushSubscription(Number(session.user.id), {
            ...payload,
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}