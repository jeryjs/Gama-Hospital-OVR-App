import { db } from '@/db';
import { locations, ovrReports, users } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { and, count, eq, sql, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Admin gets system-wide stats
    if (isAdmin) {
      // Total incidents
      const [totalResult] = await db
        .select({ count: count() })
        .from(ovrReports);

      // Stats by status
      const statusResults = await db
        .select({
          status: ovrReports.status,
          count: count(),
        })
        .from(ovrReports)
        .groupBy(ovrReports.status);

      const byStatus = {
        draft: 0,
        submitted: 0,
        supervisor_approved: 0,
        hod_assigned: 0,
        qi_final_review: 0,
        closed: 0,
      };

      statusResults.forEach((result) => {
        if (result.status in byStatus) {
          byStatus[result.status as keyof typeof byStatus] = result.count;
        }
      });

      // Incidents by department (top 10)
      const departmentResults = await db
        .select({
          locationId: ovrReports.locationId,
          count: count(),
        })
        .from(ovrReports)
        .groupBy(ovrReports.locationId)
        .orderBy(desc(count()))
        .limit(10);

      // Get location names
      const locationIds = departmentResults.map((r) => r.locationId).filter(Boolean) as number[];
      const locationData = locationIds.length > 0
        ? await db.select().from(locations).where(sql`${locations.id} IN ${locationIds}`)
        : [];

      const locationMap = new Map(locationData.map((loc) => [loc.id, loc.name]));

      const byDepartment = departmentResults.map((r) => ({
        department: r.locationId ? locationMap.get(r.locationId) || 'Unknown' : 'Unknown',
        count: r.count,
      }));

      // Recent incidents (last 5)
      const recentIncidents = await db
        .select({
          id: ovrReports.id,
          refNo: ovrReports.refNo,
          occurrenceCategory: ovrReports.occurrenceCategory,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
          reporterId: ovrReports.reporterId,
        })
        .from(ovrReports)
        .orderBy(desc(ovrReports.createdAt))
        .limit(5);

      // Get reporter names
      const reporterIds = recentIncidents.map((r) => r.reporterId);
      const reporterData = reporterIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} IN ${reporterIds}`)
        : [];

      const reporterMap = new Map(
        reporterData.map((user) => [
          user.id,
          { firstName: user.firstName, lastName: user.lastName },
        ])
      );

      const recentIncidentsWithReporters = recentIncidents.map((incident) => ({
        ...incident,
        reporter: reporterMap.get(incident.reporterId) || { firstName: 'Unknown', lastName: '' },
      }));

      // Active users count
      const [activeUsersResult] = await db.select({ count: count() }).from(users);

      // Average resolution time (simplified - days between creation and closing)
      const closedIncidents = await db
        .select({
          createdAt: ovrReports.createdAt,
          closedAt: ovrReports.closedAt,
        })
        .from(ovrReports)
        .where(eq(ovrReports.status, 'closed'))
        .limit(100);

      let avgResolutionTime = 0;
      if (closedIncidents.length > 0) {
        const totalDays = closedIncidents.reduce((sum, incident) => {
          if (incident.closedAt) {
            const days = Math.floor(
              (new Date(incident.closedAt).getTime() - new Date(incident.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0);
        avgResolutionTime = Math.round(totalDays / closedIncidents.length);
      }

      return NextResponse.json({
        total: totalResult?.count || 0,
        drafts: byStatus.draft,
        submitted: byStatus.submitted,
        resolved: byStatus.closed,
        byStatus,
        byDepartment,
        recentIncidents: recentIncidentsWithReporters,
        activeUsers: activeUsersResult?.count || 0,
        avgResolutionTime,
      });
    }

    // Regular user - their own stats
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
      byStatus: {
        draft: 0,
        submitted: 0,
        supervisor_approved: 0,
        hod_assigned: 0,
        qi_final_review: 0,
        closed: 0,
      },
      byDepartment: [],
      recentIncidents: [],
      activeUsers: 0,
      avgResolutionTime: 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
