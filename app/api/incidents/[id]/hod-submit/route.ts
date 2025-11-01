import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { problemsIdentified, causeClassification, preventionRecommendation } = body;

    if (!problemsIdentified?.trim() || !causeClassification || !preventionRecommendation?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.status !== 'hod_assigned') {
      return NextResponse.json({ error: 'Incident is not in investigation phase' }, { status: 400 });
    }

    // Only HOD or admin can submit
    if (incident.departmentHeadId?.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update with HOD report and move to QI final review
    const updated = await db
      .update(ovrReports)
      .set({
        problemsIdentified: problemsIdentified.trim(),
        causeClassification,
        preventionRecommendation: preventionRecommendation.trim(),
        hodActionDate: new Date(),
        hodSubmittedAt: new Date(),
        status: 'qi_final_review',
        updatedAt: new Date(),
      })
      .where(eq(ovrReports.id, parseInt(id)))
      .returning();

    // TODO: Send notification to QI Department

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error submitting HOD report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
