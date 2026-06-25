import { handleApiError, validateCsrfAndIdempotency } from '@/lib/api/middleware';
import { markNotificationRead } from '@/lib/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateCsrfAndIdempotency(request);
    const { id } = await params;

    await markNotificationRead(Number(session.user.id), Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}