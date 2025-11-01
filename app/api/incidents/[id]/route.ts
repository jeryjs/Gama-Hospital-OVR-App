import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import {
  handleApiError,
  requireAuth,
  validateBody,
  AuthorizationError,
  NotFoundError,
} from '@/lib/api/middleware';
import { updateIncidentSchema } from '@/lib/api/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
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
      throw new NotFoundError('Incident');
    }

    // Check permissions
    const userId = parseInt(session.user.id);
    const isOwner = incident.reporterId === userId;
    const isSupervisor = incident.supervisorId === userId;
    const isHOD = incident.departmentHeadId === userId;
    const isInvestigator = incident.investigators?.some(inv => inv.investigatorId === userId);
    const isQI = session.user.role === 'quality_manager' || session.user.role === 'admin';

    if (!isOwner && !isSupervisor && !isHOD && !isInvestigator && !isQI) {
      throw new AuthorizationError('You do not have permission to view this incident');
    }

    return NextResponse.json(incident);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    
    const existingIncident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!existingIncident) {
      throw new NotFoundError('Incident');
    }

    // Check permissions - only owner can edit draft
    if (existingIncident.status !== 'draft') {
      throw new AuthorizationError('Cannot edit submitted reports');
    }

    if (existingIncident.reporterId.toString() !== session.user.id) {
      throw new AuthorizationError('You can only edit your own reports');
    }

    // Validate request body
    const body = await validateBody(request, updateIncidentSchema);

    const updateData: Record<string, any> = {
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
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    
    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
    });

    if (!incident) {
      throw new NotFoundError('Incident');
    }

    // Only owner (if draft) or admin can delete
    const isOwner = incident.reporterId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isDraft = incident.status === 'draft';

    if (!(isOwner && isDraft) && !isAdmin) {
      throw new AuthorizationError('You can only delete draft reports or be an admin');
    }

    await db.delete(ovrReports).where(eq(ovrReports.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Incident deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}