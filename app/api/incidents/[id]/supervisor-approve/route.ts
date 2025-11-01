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

    // Only supervisors/QI/admin can approve
    if (session.user.role !== 'supervisor' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.status !== 'submitted') {
      return NextResponse.json({ error: 'Incident cannot be approved at this stage' }, { status: 400 });
    }

    // Update to supervisor_approved status
    const updated = await db
      .update(ovrReports)
      .set({
        supervisorId: parseInt(session.user.id),
        supervisorAction: action,
        supervisorActionDate: new Date(),
        supervisorApprovedAt: new Date(),
        status: 'supervisor_approved',
        updatedAt: new Date(),
      })
      .where(eq(ovrReports.id, parseInt(id)))
      .returning();

    // TODO: Send notification to QI Department

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error approving incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
