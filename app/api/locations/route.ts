import { db } from '@/db';
import { locations, ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { handleApiError, requireAuth, validateBody, NotFoundError, AuthorizationError, ValidationError } from '@/lib/api/middleware';
import { locationCreateSchema, locationUpdateSchema } from '@/lib/api/schemas';
import { eq, count } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const allLocations = await db.query.locations.findMany({
      orderBy: (locations, { asc }) => [asc(locations.name)],
    });

    return NextResponse.json(allLocations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.locations.canCreate(session.user.roles)) {
      throw new AuthorizationError('You do not have permission to create locations');
    }

    const body = await validateBody(request, locationCreateSchema);

    const newLocation = await db.insert(locations).values({
      name: body.name,
      departmentId: body.departmentId,
      building: body.building,
      floor: body.floor,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json(newLocation[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.locations.canEdit(session.user.roles)) {
      throw new AuthorizationError('You do not have permission to edit locations');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Location ID is required');
    }

    const locationId = parseInt(id, 10);
    if (isNaN(locationId)) {
      throw new ValidationError('Invalid location ID');
    }

    const body = await validateBody(request, locationUpdateSchema);

    // Check if at least one field is provided
    if (Object.keys(body).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // Check if location exists
    const existing = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    const [updatedLocation] = await db
      .update(locations)
      .set({
        ...body,
      })
      .where(eq(locations.id, locationId))
      .returning();

    return NextResponse.json(updatedLocation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.locations.canDelete(session.user.roles)) {
      throw new AuthorizationError('You do not have permission to delete locations');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Location ID is required');
    }

    const locationId = parseInt(id, 10);
    if (isNaN(locationId)) {
      throw new ValidationError('Invalid location ID');
    }

    // Check if location exists
    const existing = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    // Check if location has any incidents
    const [incidentCount] = await db
      .select({ count: count() })
      .from(ovrReports)
      .where(eq(ovrReports.locationId, locationId));

    if (incidentCount.count > 0) {
      throw new ValidationError(
        `Cannot delete location: ${incidentCount.count} incident(s) are associated with this location`
      );
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
