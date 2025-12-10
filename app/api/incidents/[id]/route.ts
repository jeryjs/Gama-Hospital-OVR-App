import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
  AuthorizationError,
  handleApiError,
  requireAuth,
  validateBody,
} from '@/lib/api/middleware';
import {
  updateIncidentSchema,
  getDetailColumns,
  incidentRelations,
} from '@/lib/api/schemas';
import { getIncidentSecure, canEditIncident, populateInvestigationUsers, populateActionUsers } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    // Use security utility - automatically filters by permissions
    const incident = await getIncidentSecure(id, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    // Fetch full details with relations
    const fullIncident = await db.query.ovrReports.findFirst({
      where: eq(ovrReports.id, id),
      columns: getDetailColumns(),
      with: incidentRelations,
    });

    if (!fullIncident) {
      return NextResponse.json(fullIncident);
    }

    // Populate user details for investigation and corrective actions
    const enrichedIncident = { ...fullIncident } as any;

    // Populate investigators in investigation
    if (fullIncident.investigation) {
      enrichedIncident.investigation = await populateInvestigationUsers(fullIncident.investigation);
    }

    // Populate assignees in corrective actions
    if (fullIncident.correctiveActions?.length) {
      enrichedIncident.correctiveActions = await Promise.all(
        fullIncident.correctiveActions.map(action => populateActionUsers(action))
      );
    }

    return NextResponse.json(enrichedIncident);
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

    // Get incident with security check
    const existingIncident = await getIncidentSecure(id, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    // Check if user can edit (own draft or QI role)
    const canEdit = canEditIncident(existingIncident, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    if (!canEdit) {
      throw new AuthorizationError('You can only edit draft reports or have QI permissions');
    }

    // Validate request body
    const body = await validateBody(request, updateIncidentSchema);

    const updateData: Record<string, any> = {
      ...body,
      updatedAt: new Date(),
    };

    // New workflow: draft -> submitted
    if (body.status === 'submitted' && existingIncident.status === 'draft') {
      updateData.submittedAt = new Date();
    }

    const updatedIncident = await db
      .update(ovrReports)
      .set(updateData)
      .where(eq(ovrReports.id, id))
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

    // Get incident with security check
    const incident = await getIncidentSecure(id, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    // Check if user can delete
    const userId = parseInt(session.user.id);
    const isOwner = incident.reporterId === userId;
    const isDraft = incident.status === 'draft';
    const canDelete = ACCESS_CONTROL.api.incidents.canDelete(
      session.user.roles,
      isOwner,
      isDraft
    );

    if (!canDelete) {
      throw new AuthorizationError(
        'You can only delete your own draft reports or have elevated permissions'
      );
    }

    await db.delete(ovrReports).where(eq(ovrReports.id, id));

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}