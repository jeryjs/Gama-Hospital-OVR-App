import { db } from '@/db';
import { ovrInvestigators } from '@/db/schema';
import { authOptions } from '@/lib/auth';
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

    // Only QI, HOD, or super admins can assign investigators
    if (!ACCESS_CONTROL.api.investigatorAssignment.canAssign(session.user.roles)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { investigatorId } = body;

    if (!investigatorId) {
      return NextResponse.json({ error: 'Investigator ID is required' }, { status: 400 });
    }

    // Check if investigator is already assigned
    const existing = await db.query.ovrInvestigators.findFirst({
      where: (investigators, { and, eq }) =>
        and(
          eq(investigators.ovrReportId, parseInt(id)),
          eq(investigators.investigatorId, investigatorId)
        ),
    });

    if (existing) {
      return NextResponse.json({ error: 'Investigator already assigned' }, { status: 400 });
    }

    const newInvestigator = await db
      .insert(ovrInvestigators)
      .values({
        ovrReportId: parseInt(id),
        investigatorId,
        assignedBy: parseInt(session.user.id),
        status: 'pending',
      })
      .returning();

    // TODO: Send email notification to investigator

    return NextResponse.json(newInvestigator[0], { status: 201 });
  } catch (error) {
    console.error('Error assigning investigator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
