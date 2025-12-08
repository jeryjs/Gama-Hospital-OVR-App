import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
  AuthorizationError,
  handleApiError,
  NotFoundError,
  requireAuth,
  validateBody,
} from '@/lib/api/middleware';
import {
  updateIncidentSchema,
  getDetailColumns,
  incidentRelations,
} from '@/lib/api/schemas';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    // Get all columns and relations for detail view
    const incident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, parseInt(id)),
      columns: getDetailColumns(), // undefined = all columns
      with: incidentRelations, // all relations
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
    const canViewAll = ACCESS_CONTROL.api.incidents.canViewAll(session.user.roles);
    const canViewDept = ACCESS_CONTROL.api.incidents.canViewDepartment(session.user.roles);
    const canViewTeam = ACCESS_CONTROL.api.incidents.canViewTeam(session.user.roles);

    const hasAccess = isOwner || isSupervisor || isHOD || isInvestigator || canViewAll || (canViewDept && isHOD) || (canViewTeam && isSupervisor);

    if (!hasAccess) {
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

    // Only owner (if draft) or privileged roles can delete
    const isOwner = incident.reporterId.toString() === session.user.id;
    const isDraft = incident.status === 'draft';
    const canDelete = ACCESS_CONTROL.api.incidents.canDelete(session.user.roles, isOwner, isDraft);

    if (!canDelete) {
      throw new AuthorizationError('You can only delete draft reports or have elevated permissions');
    }

    await db.delete(ovrReports).where(eq(ovrReports.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Incident deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}