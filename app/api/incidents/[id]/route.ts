import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
      with: {
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: {
          columns: {
            id: true,
            name: true,
            building: true,
            floor: true,
          },
        },
        supervisor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        departmentHead: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        investigators: {
          with: {
            investigator: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check permissions
    const userId = parseInt(session.user.id);
    const isOwner = incident.reporterId === userId;
    const isSupervisor = incident.supervisorId === userId;
    const isHOD = incident.departmentHeadId === userId;
    const isInvestigator = incident.investigators?.some(inv => inv.investigatorId === userId);
    const isQI = session.user.role === 'quality_manager' || session.user.role === 'admin';

    if (!isOwner && !isSupervisor && !isHOD && !isInvestigator && !isQI) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingIncident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check permissions - only owner can edit draft
    if (
      existingIncident.status !== 'draft' ||
      existingIncident.reporterId.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Cannot edit this report' }, { status: 403 });
    }

    const updateData: Partial<typeof body> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.status === 'submitted' && existingIncident.status === 'draft') {
      updateData.submittedAt = new Date();
    }

    const updatedIncident = await db
      .update(ovrReports)
      .set(updateData)
      .where(eq(ovrReports.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedIncident[0]);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Only owner (if draft) or admin can delete
    const isOwner = incident.reporterId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isDraft = incident.status === 'draft';

    if (!(isOwner && isDraft) && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.delete(ovrReports).where(eq(ovrReports.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}