import { db } from '@/db';
import { locations, ovrReports, users, ovrInvestigators as investigators } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { and, count, eq, sql, desc, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get reporters information for a list of reporter IDs
 */
async function getReporters(reporterIds: number[]) {
  if (reporterIds.length === 0) return new Map();

  const reporterData = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(sql`${users.id} = ANY(${reporterIds})`); // PostgreSQL-optimized

  return new Map(
    reporterData.map((user) => [user.id, { firstName: user.firstName, lastName: user.lastName }])
  );
}

/**
 * Calculate average resolution time in days
 * Uses SQL aggregation instead of loading all data
 */
async function getAvgResolutionTime() {
  const result = await db
    .select({
      avgDays: sql<number>`
        ROUND(AVG(EXTRACT(EPOCH FROM (${ovrReports.closedAt} - ${ovrReports.createdAt})) / 86400))
      `,
    })
    .from(ovrReports)
    .where(and(
      eq(ovrReports.status, 'closed'),
      sql`${ovrReports.closedAt} IS NOT NULL`
    ))
    .limit(1);

  return result[0]?.avgDays || 0;
}

/**
 * Get status counts grouped by status
 */
async function getStatusCounts() {
  const statusResults = await db
    .select({
      status: ovrReports.status,
      count: sql<number>`COUNT(*)::int`,
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

  return byStatus;
}

/**
 * Get recent incidents with reporter information
 */
async function getRecentIncidents(limit = 10, whereClause?: any) {
  const query = db
    .select({
      id: ovrReports.id,
      refNo: ovrReports.refNo,
      occurrenceCategory: ovrReports.occurrenceCategory,
      status: ovrReports.status,
      createdAt: ovrReports.createdAt,
      reporterId: ovrReports.reporterId,
      reporterFirstName: users.firstName,
      reporterLastName: users.lastName,
    })
    .from(ovrReports)
    .leftJoin(users, eq(ovrReports.reporterId, users.id))
    .orderBy(desc(ovrReports.createdAt))
    .limit(limit);

  const incidents = whereClause ? await query.where(whereClause) : await query;

  return incidents.map((incident) => ({
    id: incident.id,
    refNo: incident.refNo,
    occurrenceCategory: incident.occurrenceCategory,
    status: incident.status,
    createdAt: incident.createdAt,
    reporterId: incident.reporterId,
    reporter: {
      firstName: incident.reporterFirstName || 'Unknown',
      lastName: incident.reporterLastName || '',
    },
  }));
}

/**
 * Get first day of current month
 */
function getFirstDayOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get user's report counts by status
 */
async function getUserReportCounts(userId: number) {
  const result = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      drafts: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} = 'draft')::int`,
      inProgress: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} IN ('submitted', 'supervisor_approved', 'hod_assigned', 'qi_final_review'))::int`,
      resolved: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} = 'closed')::int`,
    })
    .from(ovrReports)
    .where(eq(ovrReports.reporterId, userId));

  return {
    total: result[0]?.total || 0,
    drafts: result[0]?.drafts || 0,
    inProgress: result[0]?.inProgress || 0,
    resolved: result[0]?.resolved || 0,
  };
}

// ============================================
// ROLE-SPECIFIC STATS FUNCTIONS
// ============================================

async function getAdminStats() {
  const [totalResult] = await db.select({ count: count() }).from(ovrReports);
  const byStatus = await getStatusCounts();

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

  const recentIncidents = await getRecentIncidents(5);
  const [activeUsersResult] = await db.select({ count: count() }).from(users);
  const avgResolutionTime = await getAvgResolutionTime();

  return {
    total: totalResult?.count || 0,
    drafts: byStatus.draft,
    submitted: byStatus.submitted,
    resolved: byStatus.closed,
    byStatus,
    byDepartment,
    recentIncidents,
    activeUsers: activeUsersResult?.count || 0,
    avgResolutionTime,
  };
}

async function getQualityManagerStats() {
  const [totalResult] = await db.select({ count: count() }).from(ovrReports);
  const byStatus = await getStatusCounts();

  const [closedThisMonthResult] = await db
    .select({ count: count() })
    .from(ovrReports)
    .where(and(eq(ovrReports.status, 'closed'), gte(ovrReports.closedAt, getFirstDayOfMonth())));

  const recentIncidents = await getRecentIncidents(10);
  const avgResolutionTime = await getAvgResolutionTime();

  return {
    total: totalResult?.count || 0,
    drafts: byStatus.draft,
    submitted: byStatus.submitted,
    resolved: byStatus.closed,
    byStatus,
    byDepartment: [],
    recentIncidents,
    activeUsers: 0,
    avgResolutionTime,
    closedThisMonth: closedThisMonthResult?.count || 0,
  };
}

async function getDepartmentHeadStats(userId: number) {
  // OPTIMIZED: Single query with JOINs and aggregations
  const assignedIncidents = await db
    .select({
      id: ovrReports.id,
      refNo: ovrReports.refNo,
      occurrenceCategory: ovrReports.occurrenceCategory,
      status: ovrReports.status,
      createdAt: ovrReports.createdAt,
      reporterId: ovrReports.reporterId,
      reporterFirstName: users.firstName,
      reporterLastName: users.lastName,
      investigatorCount: sql<number>`COALESCE(COUNT(${investigators.id}), 0)::int`,
    })
    .from(ovrReports)
    .leftJoin(users, eq(ovrReports.reporterId, users.id))
    .leftJoin(investigators, eq(ovrReports.id, investigators.ovrReportId))
    .where(eq(ovrReports.departmentHeadId, userId))
    .groupBy(
      ovrReports.id,
      ovrReports.refNo,
      ovrReports.occurrenceCategory,
      ovrReports.status,
      ovrReports.createdAt,
      ovrReports.reporterId,
      users.firstName,
      users.lastName
    )
    .orderBy(desc(ovrReports.createdAt));

  const myAssignedIncidents = assignedIncidents.map((incident) => ({
    id: incident.id,
    refNo: incident.refNo,
    occurrenceCategory: incident.occurrenceCategory,
    status: incident.status,
    createdAt: incident.createdAt,
    reporterId: incident.reporterId,
    reporter: {
      firstName: incident.reporterFirstName || 'Unknown',
      lastName: incident.reporterLastName || '',
    },
    needsInvestigator: incident.status === 'hod_assigned' && incident.investigatorCount === 0,
    needsFindings: incident.status === 'hod_assigned' && incident.investigatorCount > 0,
  }));

  const myActiveInvestigations = myAssignedIncidents.filter(
    (i) => i.status === 'hod_assigned' && !i.needsInvestigator
  ).length;

  const myCompletedInvestigations = myAssignedIncidents.filter(
    (i) => i.status === 'qi_final_review' || i.status === 'closed'
  ).length;

  const myNeedingFindings = myAssignedIncidents.filter((i) => i.needsFindings).length;

  return {
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
    assignedToMe: assignedIncidents.length,
    myPendingInvestigations: myAssignedIncidents.filter((i) => i.needsInvestigator).length,
    myActiveInvestigations,
    myCompletedInvestigations,
    myNeedingFindings,
    myAssignedIncidents: myAssignedIncidents.slice(0, 10),
  };
}

async function getSupervisorStats(userId: number) {
  // OPTIMIZED: Parallel queries where possible
  const [myReports, myRecentReports, pendingReports, approvedReports, [teamReportsResult]] = await Promise.all([
    getUserReportCounts(userId),

    db
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
      .limit(5),

    db
      .select({
        id: ovrReports.id,
        refNo: ovrReports.refNo,
        status: ovrReports.status,
        createdAt: ovrReports.createdAt,
        reporterId: ovrReports.reporterId,
        reporterFirstName: users.firstName,
        reporterLastName: users.lastName,
      })
      .from(ovrReports)
      .leftJoin(users, eq(ovrReports.reporterId, users.id))
      .where(eq(ovrReports.status, 'submitted'))
      .orderBy(desc(ovrReports.createdAt))
      .limit(10),

    db
      .select({
        id: ovrReports.id,
        refNo: ovrReports.refNo,
        status: ovrReports.status,
        createdAt: ovrReports.createdAt,
        supervisorApprovedAt: ovrReports.supervisorApprovedAt,
      })
      .from(ovrReports)
      .where(and(eq(ovrReports.supervisorId, userId), sql`${ovrReports.supervisorApprovedAt} IS NOT NULL`))
      .orderBy(desc(ovrReports.supervisorApprovedAt))
      .limit(5),

    db.select({ count: sql<number>`COUNT(*)::int` }).from(ovrReports),
  ]);

  const pendingWithReporters = pendingReports.map((report) => ({
    id: report.id,
    refNo: report.refNo,
    status: report.status,
    createdAt: report.createdAt,
    reporterId: report.reporterId,
    reporter: {
      firstName: report.reporterFirstName || 'Unknown',
      lastName: report.reporterLastName || '',
    },
  }));

  // Count approved this month using SQL aggregation
  const [approvedThisMonthResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(ovrReports)
    .where(
      and(
        eq(ovrReports.status, 'supervisor_approved'),
        sql`${ovrReports.supervisorApprovedAt} >= date_trunc('month', CURRENT_DATE)`
      )
    );

  return {
    total: 0,
    drafts: 0,
    submitted: 0,
    resolved: 0,
    byStatus: { draft: 0, submitted: 0, supervisor_approved: 0, hod_assigned: 0, qi_final_review: 0, closed: 0 },
    byDepartment: [],
    recentIncidents: [],
    activeUsers: 0,
    avgResolutionTime: 0,
    myReports,
    myRecentReports,
    supervisorPending: pendingReports.length,
    supervisorApproved: approvedThisMonthResult?.count || 0,
    teamReports: teamReportsResult?.count || 0,
    supervisorPendingReports: pendingWithReporters,
    supervisorApprovedReports: approvedReports,
  };
}

async function getEmployeeStats(userId: number) {
  const myReports = await getUserReportCounts(userId);

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

  return {
    total: myReports.total,
    drafts: myReports.drafts,
    submitted: 0,
    resolved: myReports.resolved,
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
    myReports,
    myRecentReports,
  };
}

// ============================================
// MAIN ROUTE HANDLER
// ============================================


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    // Route to appropriate stats function based on role
    let stats;

    switch (userRole) {
      case 'admin':
        stats = await getAdminStats();
        break;

      case 'quality_manager':
        stats = await getQualityManagerStats();
        break;

      case 'department_head':
        stats = await getDepartmentHeadStats(userId);
        break;

      case 'supervisor':
        stats = await getSupervisorStats(userId);
        break;

      default: // employee
        stats = await getEmployeeStats(userId);
        break;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
