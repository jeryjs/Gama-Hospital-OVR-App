import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, parseInt(id)),
      with: {
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        location: true,
        assignee: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        comments: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
        attachments: {
          with: {
            uploader: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
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
    if (
      session.user.role === 'employee' &&
      incident.reporterId.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Check if incident exists
    const existingIncident = await db.query.incidents.findFirst({
      where: eq(incidents.id, parseInt(id)),
    });

    if (!existingIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check permissions
    if (
      session.user.role === 'employee' &&
      existingIncident.reporterId.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // Set submittedAt if status changes to submitted
    if (body.status === 'submitted' && existingIncident.status === 'draft') {
      updateData.submittedAt = new Date();
    }

    // Set resolutionDate if status changes to resolved or closed
    if (
      (body.status === 'resolved' || body.status === 'closed') &&
      !existingIncident.resolutionDate
    ) {
      updateData.resolutionDate = new Date();
    }

    const updatedIncident = await db
      .update(incidents)
      .set(updateData)
      .where(eq(incidents.id, parseInt(id)))
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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(incidents).where(eq(incidents.id, parseInt(id)));

    return NextResponse.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
