import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { getNotificationSummary, listNotifications } from '@/lib/utils/notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = Number(session.user.id);

    const [summary, notifications] = await Promise.all([
      getNotificationSummary(userId),
      listNotifications(userId),
    ]);

    return NextResponse.json({
      unreadCount: summary.unreadCount,
      notifications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}