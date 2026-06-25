import { handleApiError, validateCsrfAndIdempotency } from '@/lib/api/middleware';
import { markAllNotificationsRead } from '@/lib/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await validateCsrfAndIdempotency(request);
    await markAllNotificationsRead(Number(session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}