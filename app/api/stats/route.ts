import { db } from '@/db';
import { locations, ovrReports, users, ovrInvestigators as investigators } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { and, count, eq, sql, desc, gte } from 'drizzle-orm';
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

    // Quality Manager - system-wide view with QI focus
    if (session.user.role === 'quality_manager') {
      const [totalResult] = await db.select({ count: count() }).from(ovrReports);

      const statusResults = await db
        .select({ status: ovrReports.status, count: count() })
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

      // Closed this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const [closedThisMonthResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(
          and(
            eq(ovrReports.status, 'closed'),
            gte(ovrReports.closedAt, firstDayOfMonth)
          )
        );

      // Recent incidents
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
        .limit(10);

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

      // Avg resolution time
      const closedIncidents = await db
        .select({ createdAt: ovrReports.createdAt, closedAt: ovrReports.closedAt })
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
        byDepartment: [],
        recentIncidents: recentIncidentsWithReporters,
        activeUsers: 0,
        avgResolutionTime,
        closedThisMonth: closedThisMonthResult?.count || 0,
      });
    }

    // Department Head - their assigned cases
    if (session.user.role === 'department_head') {
      // Cases assigned to this HOD
      const assignedIncidents = await db
        .select({
          id: ovrReports.id,
          refNo: ovrReports.refNo,
          occurrenceCategory: ovrReports.occurrenceCategory,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
          reporterId: ovrReports.reporterId,
        })
        .from(ovrReports)
        .where(eq(ovrReports.departmentHeadId, userId))
        .orderBy(desc(ovrReports.createdAt));

      const [assignedCount] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(eq(ovrReports.departmentHeadId, userId));

      // Count by investigation status
      const [pendingInvestigators] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(
          and(
            eq(ovrReports.departmentHeadId, userId),
            eq(ovrReports.status, 'hod_assigned')
          )
        );

      // Get reporters for assigned incidents
      const reporterIds = assignedIncidents.map((r) => r.reporterId);
      const reporterData = reporterIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} IN ${reporterIds}`)
        : [];

      const reporterMap = new Map(
        reporterData.map((user) => [
          user.id,
          { firstName: user.firstName, lastName: user.lastName },
        ])
      );

      // Check which incidents need investigators or findings
      const incidentsWithInvestigators = await db
        .select({ incidentId: investigators.ovrReportId, count: count() })
        .from(investigators)
        .where(sql`${investigators.ovrReportId} IN ${assignedIncidents.map((i) => i.id)}`)
        .groupBy(investigators.ovrReportId);

      const investigatorCountMap = new Map(
        incidentsWithInvestigators.map((inv) => [inv.incidentId, inv.count])
      );

      const myAssignedIncidents = assignedIncidents.map((incident) => ({
        ...incident,
        reporter: reporterMap.get(incident.reporterId) || { firstName: 'Unknown', lastName: '' },
        needsInvestigator: incident.status === 'hod_assigned' && (!investigatorCountMap.has(incident.id) || investigatorCountMap.get(incident.id) === 0),
        needsFindings: incident.status === 'hod_assigned' && investigatorCountMap.has(incident.id) && investigatorCountMap.get(incident.id)! > 0,
      }));

      const myActiveInvestigations = myAssignedIncidents.filter(
        (i) => i.status === 'hod_assigned' && !i.needsInvestigator
      ).length;

      const myCompletedInvestigations = myAssignedIncidents.filter(
        (i) => i.status === 'qi_final_review' || i.status === 'closed'
      ).length;

      const myNeedingFindings = myAssignedIncidents.filter((i) => i.needsFindings).length;

      return NextResponse.json({
        total: 0,
        drafts: 0,
        submitted: 0,
        resolved: 0,
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
        assignedToMe: assignedCount?.count || 0,
        myPendingInvestigations: myAssignedIncidents.filter((i) => i.needsInvestigator).length,
        myActiveInvestigations,
        myCompletedInvestigations,
        myNeedingFindings,
        myAssignedIncidents: myAssignedIncidents.slice(0, 10),
      });
    }

    // Supervisor - their own reports + team reports + pending approvals
    if (session.user.role === 'supervisor') {
      // My reports
      const [myTotalResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(eq(ovrReports.reporterId, userId));

      const [myDraftsResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(and(eq(ovrReports.reporterId, userId), eq(ovrReports.status, 'draft')));

      const [myInProgressResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(
          and(
            eq(ovrReports.reporterId, userId),
            sql`${ovrReports.status} IN ('submitted', 'supervisor_approved', 'hod_assigned', 'qi_final_review')`
          )
        );

      const [myResolvedResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(and(eq(ovrReports.reporterId, userId), eq(ovrReports.status, 'closed')));

      // My recent reports
      const myRecentReports = await db
        .select({
          id: ovrReports.id,
          refNo: ovrReports.refNo,
          occurrenceCategory: ovrReports.occurrenceCategory,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
        })
        .from(ovrReports)
        .where(eq(ovrReports.reporterId, userId))
        .orderBy(desc(ovrReports.createdAt))
        .limit(5);

      // Pending approvals (submitted status - waiting for supervisor)
      const [pendingResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(eq(ovrReports.status, 'submitted'));

      const pendingReports = await db
        .select({
          id: ovrReports.id,
          refNo: ovrReports.refNo,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
          reporterId: ovrReports.reporterId,
        })
        .from(ovrReports)
        .where(eq(ovrReports.status, 'submitted'))
        .orderBy(desc(ovrReports.createdAt))
        .limit(10);

      // Approved this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const [approvedThisMonthResult] = await db
        .select({ count: count() })
        .from(ovrReports)
        .where(
          and(
            eq(ovrReports.status, 'supervisor_approved'),
            gte(ovrReports.supervisorApprovedAt, firstDayOfMonth)
          )
        );

      const approvedReports = await db
        .select({
          id: ovrReports.id,
          refNo: ovrReports.refNo,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
          supervisorApprovedAt: ovrReports.supervisorApprovedAt,
        })
        .from(ovrReports)
        .where(
          and(
            eq(ovrReports.supervisorId, userId),
            sql`${ovrReports.supervisorApprovedAt} IS NOT NULL`
          )
        )
        .orderBy(desc(ovrReports.supervisorApprovedAt))
        .limit(5);

      // Team reports count
      const [teamReportsResult] = await db
        .select({ count: count() })
        .from(ovrReports);

      // Get reporter info for pending
      const reporterIds = pendingReports.map((r) => r.reporterId);
      const reporterData = reporterIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} IN ${reporterIds}`)
        : [];

      const reporterMap = new Map(
        reporterData.map((user) => [user.id, { firstName: user.firstName, lastName: user.lastName }])
      );

      const pendingWithReporters = pendingReports.map((report) => ({
        ...report,
        reporter: reporterMap.get(report.reporterId) || { firstName: 'Unknown', lastName: '' },
      }));

      return NextResponse.json({
        total: 0,
        drafts: 0,
        submitted: 0,
        resolved: 0,
        byStatus: { draft: 0, submitted: 0, supervisor_approved: 0, hod_assigned: 0, qi_final_review: 0, closed: 0 },
        byDepartment: [],
        recentIncidents: [],
        activeUsers: 0,
        avgResolutionTime: 0,
        myReports: {
          total: myTotalResult?.count || 0,
          drafts: myDraftsResult?.count || 0,
          inProgress: myInProgressResult?.count || 0,
          resolved: myResolvedResult?.count || 0,
        },
        myRecentReports,
        supervisorPending: pendingResult?.count || 0,
        supervisorApproved: approvedThisMonthResult?.count || 0,
        teamReports: teamReportsResult?.count || 0,
        supervisorPendingReports: pendingWithReporters,
        supervisorApprovedReports: approvedReports,
      });
    }

    // Regular user (Employee/Staff) - their own stats
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

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(
        and(
          eq(ovrReports.reporterId, userId),
          sql`${ovrReports.status} IN ('submitted', 'supervisor_approved', 'hod_assigned', 'qi_final_review')`
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

    const myRecentReports = await db
      .select({
        id: ovrReports.id,
        refNo: ovrReports.refNo,
        occurrenceCategory: ovrReports.occurrenceCategory,
        status: ovrReports.status,
        createdAt: ovrReports.createdAt,
      })
      .from(ovrReports)
      .where(eq(ovrReports.reporterId, userId))
      .orderBy(desc(ovrReports.createdAt))
      .limit(5);

    return NextResponse.json({
      total: totalResult?.count || 0,
      drafts: draftsResult?.count || 0,
      submitted: 0,
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
      myReports: {
        total: totalResult?.count || 0,
        drafts: draftsResult?.count || 0,
        inProgress: inProgressResult?.count || 0,
        resolved: resolvedResult?.count || 0,
      },
      myRecentReports,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
