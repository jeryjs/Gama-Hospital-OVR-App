import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { getNotificationSummary } from '@/lib/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = Number(session.user.id);

    const summary = await getNotificationSummary(userId);

    return NextResponse.json({
      unreadCount: summary.unreadCount,
      notifications: summary.notifications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}