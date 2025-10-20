import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { sql, eq, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get date range from query params (default to last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total incidents
    const totalIncidents = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents);

    // Incidents by status
    const incidentsByStatus = await db
      .select({
        status: incidents.status,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .groupBy(incidents.status);

    // Incidents by severity
    const incidentsBySeverity = await db
      .select({
        severity: incidents.severity,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .groupBy(incidents.severity);

    // Incidents by type
    const incidentsByType = await db
      .select({
        type: incidents.incidentType,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .groupBy(incidents.incidentType);

    // Recent incidents (last 30 days)
    const recentIncidents = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(gte(incidents.createdAt, startDate));

    // Incidents with injuries
    const incidentsWithInjuries = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.injuriesOccurred, true));

    // Police notified incidents
    const policeNotifiedIncidents = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.policeNotified, true));

    return NextResponse.json({
      totalIncidents: totalIncidents[0].count,
      recentIncidents: recentIncidents[0].count,
      incidentsWithInjuries: incidentsWithInjuries[0].count,
      policeNotifiedIncidents: policeNotifiedIncidents[0].count,
      byStatus: incidentsByStatus,
      bySeverity: incidentsBySeverity,
      byType: incidentsByType,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
