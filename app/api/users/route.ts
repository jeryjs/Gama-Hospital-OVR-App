import { db } from '@/db';
import { users } from '@/db/schema';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { and, asc, count, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_CONTROL } from '@/lib/access-control';

/**
 * GET /api/users - Paginated user management endpoint (Admin only)
 * 
 * For user search/autocomplete, use GET /api/users/search instead
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    // Admin-only paginated user management endpoint
    if (!ACCESS_CONTROL.api.users.canView(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const search = searchParams.get('search')?.trim() || '';
    const rolesParam = searchParams.get('roles'); // Comma-separated roles
    const isActiveParam = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build WHERE conditions
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.employeeId, `%${search}%`),
          ilike(users.department, `%${search}%`)
        )!
      );
    }

    // Filter by roles (user must have ANY of the specified roles)
    if (rolesParam) {
      const targetRoles = rolesParam.split(',').map(r => r.trim());
      // PostgreSQL: roles array overlaps with target roles array
      conditions.push(
        sql`${users.roles}::text[] && ARRAY[${sql.join(targetRoles.map(r => sql`${r}`), sql`, `)}]::text[]`
      );
    }

    if (isActiveParam === 'true') {
      conditions.push(eq(users.isActive, true));
    } else if (isActiveParam === 'false') {
      conditions.push(eq(users.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Build ORDER BY clause - map string to actual column
    const columnMap = {
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: users.department,
    };
    const orderByColumn = columnMap[sortBy as keyof typeof columnMap] || users.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

    // Fetch paginated data
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        employeeId: users.employeeId,
        firstName: users.firstName,
        lastName: users.lastName,
        roles: users.roles,
        department: users.department,
        position: users.position,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.users.canManage(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate allowed fields (roles and adGroups should come from AD sync, not manual updates)
    const allowedFields = ['department', 'position', 'isActive', 'employeeId'];
    const filteredUpdates: any = {};

    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Prevent admin from deactivating themselves
    if (updates.isActive === false && userId === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    filteredUpdates.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(filteredUpdates)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
