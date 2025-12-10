import { db } from '@/db';
import { departments, locations, ovrReports } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    handleApiError,
    requireAuth,
    validateBody,
    NotFoundError,
    AuthorizationError,
    ValidationError,
} from '@/lib/api/middleware';
import { locationCreateSchema, locationUpdateSchema } from '@/lib/api/schemas';
import { eq, count, asc, and, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * GET /api/departments/[id]/locations
 * Returns all locations for a specific department
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);

        const { id } = await context.params;
        const departmentId = parseInt(id, 10);

        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        // Check if department exists
        const department = await db.query.departments.findFirst({
            where: eq(departments.id, departmentId),
        });

        if (!department) {
            throw new NotFoundError('Department');
        }

        // Fetch locations for this department, sorted by displayOrder
        const departmentLocations = await db
            .select({
                id: locations.id,
                name: locations.name,
                building: locations.building,
                floor: locations.floor,
                displayOrder: locations.displayOrder,
                isActive: locations.isActive,
            })
            .from(locations)
            .where(eq(locations.departmentId, departmentId))
            .orderBy(
                sql`COALESCE(${locations.displayOrder}, 999999)`,
                asc(locations.name)
            );

        return NextResponse.json(departmentLocations);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/departments/[id]/locations
 * Create a new location under this department
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canCreate(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to create locations');
        }

        const { id } = await context.params;
        const departmentId = parseInt(id, 10);

        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        // Check if department exists
        const department = await db.query.departments.findFirst({
            where: eq(departments.id, departmentId),
        });

        if (!department) {
            throw new NotFoundError('Department');
        }

        // Schema without departmentId (we get it from URL)
        const bodySchema = locationCreateSchema.omit({ departmentId: true });
        const body = await validateBody(request, bodySchema);

        // Get max displayOrder for this department
        const [maxOrderResult] = await db
            .select({ maxOrder: sql<number>`COALESCE(MAX(${locations.displayOrder}), 0)` })
            .from(locations)
            .where(eq(locations.departmentId, departmentId));

        const nextOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

        const [newLocation] = await db.insert(locations).values({
            name: body.name,
            departmentId: departmentId,
            building: body.building,
            floor: body.floor,
            displayOrder: body.displayOrder ?? nextOrder,
            isActive: body.isActive ?? true,
        }).returning();

        return NextResponse.json(newLocation, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * PATCH /api/departments/[id]/locations
 * Update a location (locationId in body)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canEdit(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to edit locations');
        }

        const { id } = await context.params;
        const departmentId = parseInt(id, 10);

        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        // Schema with required locationId
        const patchSchema = locationUpdateSchema.extend({
            locationId: z.number().int().positive(),
        });
        const body = await validateBody(request, patchSchema);

        const { locationId, ...updateData } = body;

        if (Object.keys(updateData).length === 0) {
            throw new ValidationError('At least one field must be provided for update');
        }

        // Check if location exists and belongs to this department
        const existing = await db.query.locations.findFirst({
            where: and(
                eq(locations.id, locationId),
                eq(locations.departmentId, departmentId)
            ),
        });

        if (!existing) {
            throw new NotFoundError('Location not found in this department');
        }

        const [updatedLocation] = await db
            .update(locations)
            .set(updateData)
            .where(eq(locations.id, locationId))
            .returning();

        return NextResponse.json(updatedLocation);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/departments/[id]/locations
 * Delete a location (locationId in body or query param)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canDelete(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to delete locations');
        }

        const { id } = await context.params;
        const departmentId = parseInt(id, 10);

        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        // Get locationId from body or query params
        let locationId: number | undefined;

        const { searchParams } = new URL(request.url);
        const queryLocationId = searchParams.get('locationId');

        if (queryLocationId) {
            locationId = parseInt(queryLocationId, 10);
        } else {
            try {
                const body = await request.json();
                locationId = body.locationId;
            } catch {
                // No body provided
            }
        }

        if (!locationId || isNaN(locationId)) {
            throw new ValidationError('Location ID is required');
        }

        // Check if location exists and belongs to this department
        const existing = await db.query.locations.findFirst({
            where: and(
                eq(locations.id, locationId),
                eq(locations.departmentId, departmentId)
            ),
        });

        if (!existing) {
            throw new NotFoundError('Location not found in this department');
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
