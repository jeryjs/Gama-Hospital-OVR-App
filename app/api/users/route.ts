import { db } from '@/db';
import { users } from '@/db/schema';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { userCreateSchema, userUpdateSchema } from '@/lib/api/schemas';
import { APP_ROLES } from '@/lib/constants';
import { and, asc, count, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_CONTROL } from '@/lib/access-control';

const VALID_ROLES = new Set(Object.values(APP_ROLES));

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateRoles(roles: unknown): string[] | null {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null;
  }

  const normalized = [...new Set(roles.map((role) => String(role).trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return null;
  }

  const hasInvalidRole = normalized.some((role) => !VALID_ROLES.has(role as any));
  if (hasInvalidRole) {
    return null;
  }

  return normalized;
}

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

    const parsedUpdates = userUpdateSchema.safeParse(updates || {});
    if (!parsedUpdates.success) {
      return NextResponse.json({ error: 'Invalid update payload', details: parsedUpdates.error.issues }, { status: 400 });
    }

    // Validate allowed fields
    const allowedFields = ['department', 'position', 'isActive', 'employeeId', 'roles'];
    const filteredUpdates: any = {};

    for (const key of allowedFields) {
      if (key in parsedUpdates.data) {
        filteredUpdates[key] = (parsedUpdates.data as any)[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if ('roles' in filteredUpdates) {
      const validRoles = validateRoles(filteredUpdates.roles);
      if (!validRoles) {
        return NextResponse.json({ error: 'Invalid roles. Use at least one valid application role.' }, { status: 400 });
      }
      filteredUpdates.roles = validRoles;
    }

    // Prevent admin from deactivating themselves
    if (updates.isActive === false && userId === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Prevent admin from removing own management access
    if (userId === parseInt(session.user.id) && filteredUpdates.roles) {
      if (!ACCESS_CONTROL.api.users.canManage(filteredUpdates.roles as any)) {
        return NextResponse.json(
          { error: 'Cannot remove your own administrative access' },
          { status: 400 }
        );
      }
    }

    filteredUpdates.department = normalizeOptionalText(filteredUpdates.department);
    filteredUpdates.position = normalizeOptionalText(filteredUpdates.position);
    filteredUpdates.employeeId = normalizeOptionalText(filteredUpdates.employeeId);

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

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.users.canManage(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const roles = validateRoles(parsed.data.roles);

    if (!roles) {
      return NextResponse.json(
        { error: 'At least one valid role is required' },
        { status: 400 }
      );
    }

    const existing = await db.query.users.findFirst({
      where: sql`LOWER(${users.email}) = ${email}`,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        email,
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName.trim(),
        roles,
        department: normalizeOptionalText(parsed.data.department),
        position: normalizeOptionalText(parsed.data.position),
        employeeId: normalizeOptionalText(parsed.data.employeeId),
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: createdUser,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
