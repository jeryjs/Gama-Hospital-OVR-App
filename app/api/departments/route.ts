import { db } from '@/db';
import { departments, locations } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    handleApiError,
    requireAuth,
    validateBody,
    NotFoundError,
    AuthorizationError,
    ValidationError,
    createPaginatedResponse,
} from '@/lib/api/middleware';
import { departmentCreateSchema, departmentUpdateSchema } from '@/lib/api/schemas';
import { generateDepartmentCode } from '@/lib/utils/departments';
import { eq, count, asc, desc, and, ilike, or, SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);

        const { searchParams } = new URL(request.url);

        // Check for simple list mode (for dropdowns)
        const simple = searchParams.get('simple');
        if (simple === 'true') {
            const allDepartments = await db.query.departments.findMany({
                where: eq(departments.isActive, true),
                orderBy: [asc(departments.name)],
                columns: {
                    id: true,
                    name: true,
                    code: true,
                },
            });
            return NextResponse.json(allDepartments);
        }

        // Parse pagination parameters
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
        const search = searchParams.get('search')?.trim() || '';
        const includeLocations = searchParams.get('includeLocations') === 'true';
        const isActiveParam = searchParams.get('isActive');
        const sortBy = searchParams.get('sortBy') || 'name';
        const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

        // Build WHERE conditions
        const conditions: SQL[] = [];

        if (search) {
            conditions.push(
                or(
                    ilike(departments.name, `%${search}%`),
                    ilike(departments.code, `%${search}%`)
                )!
            );
        }

        if (isActiveParam === 'true') {
            conditions.push(eq(departments.isActive, true));
        } else if (isActiveParam === 'false') {
            conditions.push(eq(departments.isActive, false));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await db
            .select({ count: count() })
            .from(departments)
            .where(whereClause);

        const total = Number(countResult?.count || 0);
        const offset = (page - 1) * pageSize;

        // Build ORDER BY clause
        const columnMap = {
            name: departments.name,
            code: departments.code,
            createdAt: departments.createdAt,
        };
        const orderByColumn = columnMap[sortBy as keyof typeof columnMap] || departments.name;
        const orderByClause = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

        // Fetch departments with optional relations
        if (includeLocations) {
            const data = await db.query.departments.findMany({
                where: whereClause,
                orderBy: [orderByClause],
                limit: pageSize,
                offset,
                with: {
                    locations: {
                        columns: {
                            id: true,
                            name: true,
                            building: true,
                            floor: true,
                            displayOrder: true,
                            isActive: true,
                        },
                        orderBy: (locations, { asc, sql }) => [
                            asc(sql`COALESCE(${locations.displayOrder}, 999999)`),
                            asc(locations.name),
                        ],
                    },
                    headOfDepartment: {
                        columns: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            // Transform to match DepartmentWithLocations schema
            const transformedData = data.map(dept => ({
                ...dept,
                head: dept.headOfDepartment,
                locations: (dept as any).locations || [],
            }));

            return NextResponse.json(
                createPaginatedResponse(transformedData, total, { page, limit: pageSize, sortOrder })
            );
        }

        // Simple fetch without relations
        const data = await db
            .select()
            .from(departments)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(pageSize)
            .offset(offset);

        return NextResponse.json(
            createPaginatedResponse(data, total, { page, limit: pageSize, sortOrder })
        );
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canCreate(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to create departments');
        }

        const body = await validateBody(request, departmentCreateSchema);

        // Always auto-generate internal code (never user-provided)
        const code = generateDepartmentCode(body.name);

        const [newDepartment] = await db.insert(departments).values({
            name: body.name,
            code,
            headOfDepartment: body.headId,
            isActive: body.isActive ?? true,
        }).returning();

        return NextResponse.json(newDepartment, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canEdit(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to edit departments');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('Department ID is required');
        }

        const departmentId = parseInt(id, 10);
        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        const body = await validateBody(request, departmentUpdateSchema);

        // Check if at least one field is provided
        if (Object.keys(body).length === 0) {
            throw new ValidationError('At least one field must be provided for update');
        }

        // Check if department exists
        const existing = await db.query.departments.findFirst({
            where: eq(departments.id, departmentId),
        });

        if (!existing) {
            throw new NotFoundError('Department');
        }

        // Build update object, mapping headId to headOfDepartment
        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.code !== undefined) updateData.code = body.code;
        if (body.headId !== undefined) updateData.headOfDepartment = body.headId;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const [updatedDepartment] = await db
            .update(departments)
            .set(updateData)
            .where(eq(departments.id, departmentId))
            .returning();

        return NextResponse.json(updatedDepartment);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.locations.canDelete(session.user.roles)) {
            throw new AuthorizationError('You do not have permission to delete departments');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('Department ID is required');
        }

        const departmentId = parseInt(id, 10);
        if (isNaN(departmentId)) {
            throw new ValidationError('Invalid department ID');
        }

        // Check if department exists
        const existing = await db.query.departments.findFirst({
            where: eq(departments.id, departmentId),
        });

        if (!existing) {
            throw new NotFoundError('Department');
        }

        // Check if department has any active locations
        const [locationCount] = await db
            .select({ count: count() })
            .from(locations)
            .where(and(
                eq(locations.departmentId, departmentId),
                eq(locations.isActive, true)
            ));

        if (locationCount.count > 0) {
            throw new ValidationError(
                `Cannot delete department: ${locationCount.count} active location(s) are associated with this department`
            );
        }

        await db.delete(departments).where(eq(departments.id, departmentId));

        return NextResponse.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        return handleApiError(error);
    }
}
