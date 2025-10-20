import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Fetch incidents for the current user
    const incidents = await db
      .select({
        id: ovrReports.id,
        referenceNumber: ovrReports.referenceNumber,
        occurrenceDate: ovrReports.occurrenceDate,
        occurrenceCategory: ovrReports.occurrenceCategory,
        occurrenceSubcategory: ovrReports.occurrenceSubcategory,
        status: ovrReports.status,
        createdAt: ovrReports.createdAt,
      })
      .from(ovrReports)
      .where(eq(ovrReports.reporterId, userId))
      .orderBy(desc(ovrReports.createdAt));

    return NextResponse.json(incidents);
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
    const userId = parseInt(session.user.id);

    // Generate reference number
    const year = new Date().getFullYear();
    const count = await db
      .select()
      .from(ovrReports)
      .then((rows) => rows.length + 1);
    const referenceNumber = `OVR-${year}-${String(count).padStart(3, '0')}`;

    const newIncident = await db
      .insert(ovrReports)
      .values({
        referenceNumber,
        reporterId: userId,
        occurrenceDate: body.occurrenceDate,
        occurrenceTime: body.occurrenceTime,
        locationId: body.locationId,
        specificLocation: body.specificLocation,
        personInvolved: body.personInvolved,
        isSentinelEvent: body.isSentinelEvent || false,
        sentinelEventDetails: body.sentinelEventDetails,
        occurrenceCategory: body.occurrenceCategory,
        occurrenceSubcategory: body.occurrenceSubcategory,
        description: body.description,
        reporterDepartment: session.user.department,
        reporterPosition: session.user.position,
        status: body.status || 'draft',
        submittedAt: body.status === 'submitted' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
