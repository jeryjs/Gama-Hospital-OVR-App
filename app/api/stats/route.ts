import { db } from '@/db';
import { locations, ovrReports, users, ovrInvestigations, ovrCorrectiveActions } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { and, count, eq, sql, desc, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { hasAnyRole } from '@/lib/auth-helpers';
import { APP_ROLES, AppRole } from '@/lib/constants';

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
    qi_review: 0,
    investigating: 0,
    qi_final_actions: 0,
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
      // refNo removed - id IS the refNo now
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
    id: incident.id, // Already a string
    refNo: incident.id, // For backward compatibility in UI
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
      inProgress: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} IN ('submitted', 'qi_review', 'investigating', 'qi_final_actions'))::int`,
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
    // submitted: byStatus.submitted,
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
    // submitted: byStatus.submitted,
    resolved: byStatus.closed,
    byStatus,
    byDepartment: [],
    recentIncidents,
    activeUsers: 0,
    avgResolutionTime,
    closedThisMonth: closedThisMonthResult?.count || 0,
  };
}

// getDepartmentHeadStats removed - HOD role eliminated

async function getSupervisorStats(userId: number) {
  // OPTIMIZED: Parallel queries where possible
  // REMOVED: Pending approval queries - incidents go directly to QI now
  const [myReports, myRecentReports, [teamReportsResult]] = await Promise.all([
    getUserReportCounts(userId),

    db
      .select({
        id: ovrReports.id, // String ID now
        refNo: ovrReports.id, // For backward compatibility
        occurrenceCategory: ovrReports.occurrenceCategory,
        status: ovrReports.status,
        createdAt: ovrReports.createdAt,
      })
      .from(ovrReports)
      .where(eq(ovrReports.reporterId, userId))
      .orderBy(desc(ovrReports.createdAt))
      .limit(5),

    db.select({ count: sql<number>`COUNT(*)::int` }).from(ovrReports),
  ]);

  return {
    total: 0,
    drafts: 0,
    submitted: 0,
    resolved: 0,
    byStatus: { draft: 0, submitted: 0, qi_review: 0, investigating: 0, qi_final_actions: 0, closed: 0 },
    byDepartment: [],
    recentIncidents: [],
    activeUsers: 0,
    avgResolutionTime: 0,
    myReports,
    myRecentReports,
    teamReports: teamReportsResult?.count || 0,
  };
}

async function getEmployeeStats(userId: number) {
  const myReports = await getUserReportCounts(userId);

  const myRecentReports = await db
    .select({
      id: ovrReports.id, // String ID
      refNo: ovrReports.id, // For backward compatibility
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
      qi_review: 0,
      investigating: 0,
      qi_final_actions: 0,
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


type Stats = Awaited<
  ReturnType<
    typeof getAdminStats |
    typeof getQualityManagerStats |
    typeof getSupervisorStats |
    typeof getEmployeeStats
  >
>;

/**
 * Ordered handlers that decide which stats to return based on roles.
 * Keep the inline comments exactly as they were in the original if/else for clarity.
 */
const STATS_HANDLERS: { predicate: (roles: AppRole[]) => boolean; handler: (userId: number, roles: AppRole[]) => Promise<Stats> }[] = [
  {
    // Super admins, tech admins, developers see full system stats
    predicate: (roles) => ACCESS_CONTROL.api.stats.canViewSystemStats(roles),
    handler: async () => getAdminStats(),
  },
  {
    // Executives see high-level overview
    predicate: (roles) => ACCESS_CONTROL.api.stats.canViewExecutiveStats(roles),
    handler: async () => getAdminStats(), // TODO: Create getExecutiveStats() for filtered view
  },
  {
    // Quality managers/analysts see QI workflow stats
    predicate: (roles) => ACCESS_CONTROL.api.stats.canViewQIStats(roles),
    handler: async () => getQualityManagerStats(),
  },
  {
    // Supervisors see team incidents
    predicate: (roles) => ACCESS_CONTROL.api.stats.canViewTeamStats(roles),
    handler: async (userId) => getSupervisorStats(userId),
  },
];

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
    const roles = session.user.roles;

    // Route to appropriate stats function based on highest priority role
    const matched = STATS_HANDLERS.find((h) => h.predicate(roles));
    const stats = matched ? await matched.handler(userId, roles) : await getEmployeeStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
