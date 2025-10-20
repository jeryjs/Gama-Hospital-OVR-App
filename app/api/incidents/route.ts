import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { desc, eq, and, or, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');

    let query = db.query.incidents.findMany({
      with: {
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: true,
        assignee: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(incidents.createdAt)],
    });

    // For employees, only show their own incidents
    if (session.user.role === 'employee') {
      const allIncidents = await query;
      const filteredIncidents = allIncidents.filter(
        (incident) => incident.reporterId.toString() === session.user.id
      );
      return NextResponse.json(filteredIncidents);
    }

    // For admins and managers, show all incidents
    const allIncidents = await query;
    let filteredIncidents = allIncidents;

    if (status) {
      filteredIncidents = filteredIncidents.filter((i) => i.status === status);
    }

    if (severity) {
      filteredIncidents = filteredIncidents.filter((i) => i.severity === severity);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredIncidents = filteredIncidents.filter(
        (i) =>
          i.description?.toLowerCase().includes(searchLower) ||
          i.victimName?.toLowerCase().includes(searchLower) ||
          i.perpetratorName?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(filteredIncidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newIncident = await db.insert(incidents).values({
      reporterId: parseInt(session.user.id),
      incidentDate: new Date(body.incidentDate),
      incidentTime: body.incidentTime,
      locationId: body.locationId,
      specificLocation: body.specificLocation,
      incidentType: body.incidentType,
      severity: body.severity,
      status: body.status || 'draft',
      victimName: body.victimName,
      victimRole: body.victimRole,
      perpetratorName: body.perpetratorName,
      perpetratorType: body.perpetratorType,
      perpetratorDescription: body.perpetratorDescription,
      description: body.description,
      immediateAction: body.immediateAction,
      witnessesPresent: body.witnessesPresent,
      witnessDetails: body.witnessDetails,
      policeNotified: body.policeNotified,
      policeReportNumber: body.policeReportNumber,
      injuriesOccurred: body.injuriesOccurred,
      injuryDescription: body.injuryDescription,
      medicalAttentionRequired: body.medicalAttentionRequired,
      medicalAttentionDetails: body.medicalAttentionDetails,
      submittedAt: body.status === 'submitted' ? new Date() : null,
    }).returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
