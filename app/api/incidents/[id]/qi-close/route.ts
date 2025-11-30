import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_CONTROL } from '@/lib/access-control';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QI managers can close incidents
    if (!ACCESS_CONTROL.api.qualityInspection.canCloseIncident(session.user.roles)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      feedback,
      formComplete,
      causeIdentified,
      timeframe,
      actionComplies,
      effectiveAction,
      severityLevel,
    } = body;

    if (!feedback?.trim() || !severityLevel) {
      return NextResponse.json({ error: 'Feedback and severity level are required' }, { status: 400 });
    }

    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.status !== 'qi_final_review') {
      return NextResponse.json({ error: 'Incident is not ready for closure' }, { status: 400 });
    }

    // Close the case
    const updated = await db
      .update(ovrReports)
      .set({
        qiFeedback: feedback.trim(),
        qiFormComplete: formComplete || false,
        qiProperCauseIdentified: causeIdentified || false,
        qiProperTimeframe: timeframe || false,
        qiActionCompliesStandards: actionComplies || false,
        qiEffectiveCorrectiveAction: effectiveAction || false,
        severityLevel,
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ovrReports.id, parseInt(id)))
      .returning();

    // TODO: Send notification to reporter and all stakeholders

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error closing case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
