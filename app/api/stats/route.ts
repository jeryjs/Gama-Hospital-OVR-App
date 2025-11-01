import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { and, count, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get stats for the current user
    const [totalResult] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(eq(ovrReports.reporterId, userId));

    const [draftsResult] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(
        and(
          eq(ovrReports.reporterId, userId),
          eq(ovrReports.status, 'draft')
        )
      );

    const [submittedResult] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(
        and(
          eq(ovrReports.reporterId, userId),
          eq(ovrReports.status, 'submitted')
        )
      );

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(
        and(
          eq(ovrReports.reporterId, userId),
          eq(ovrReports.status, 'closed')
        )
      );

    return NextResponse.json({
      total: totalResult?.count || 0,
      drafts: draftsResult?.count || 0,
      submitted: submittedResult?.count || 0,
      resolved: resolvedResult?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
