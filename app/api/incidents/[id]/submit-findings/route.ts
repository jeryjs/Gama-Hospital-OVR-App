import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { ovrInvestigators } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { findings } = body;

    if (!findings?.trim()) {
      return NextResponse.json({ error: 'Findings are required' }, { status: 400 });
    }

    // Check if user is assigned as investigator
    const investigatorRecord = await db.query.ovrInvestigators.findFirst({
      where: (investigators, { and, eq }) => 
        and(
          eq(investigators.ovrReportId, parseInt(id)),
          eq(investigators.investigatorId, parseInt(session.user.id))
        ),
    });

    if (!investigatorRecord) {
      return NextResponse.json({ error: 'You are not assigned as an investigator' }, { status: 403 });
    }

    if (investigatorRecord.status === 'submitted') {
      return NextResponse.json({ error: 'Findings already submitted' }, { status: 400 });
    }

    // Update investigator findings
    const updated = await db
      .update(ovrInvestigators)
      .set({
        findings: findings.trim(),
        status: 'submitted',
        submittedAt: new Date(),
      })
      .where(eq(ovrInvestigators.id, investigatorRecord.id))
      .returning();

    // TODO: Notify HOD that findings are submitted

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error submitting findings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
