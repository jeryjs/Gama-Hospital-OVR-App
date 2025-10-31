import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { ovrReports, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QI or admin can assign to HOD
    if (session.user.role !== 'quality_manager' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { departmentHeadId } = body;

    if (!departmentHeadId) {
      return NextResponse.json({ error: 'Department Head ID is required' }, { status: 400 });
    }

    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.status !== 'supervisor_approved') {
      return NextResponse.json({ error: 'Incident must be supervisor approved first' }, { status: 400 });
    }

    // Assign to HOD and update status
    const updated = await db
      .update(ovrReports)
      .set({
        qiReceivedBy: parseInt(session.user.id),
        qiReceivedDate: new Date(),
        qiAssignedBy: parseInt(session.user.id),
        qiAssignedDate: new Date(),
        departmentHeadId,
        hodAssignedAt: new Date(),
        status: 'hod_assigned',
        updatedAt: new Date(),
      })
      .where(eq(ovrReports.id, parseInt(id)))
      .returning();

    // TODO: Send notification to HOD

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error assigning to HOD:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
