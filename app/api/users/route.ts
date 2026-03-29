import { db } from '@/db';
import { userAdminAuditLogs, users } from '@/db/schema';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { userCreateSchema, userUpdateSchema } from '@/lib/api/schemas';
import { APP_ROLES } from '@/lib/constants';
import { and, asc, count, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_CONTROL } from '@/lib/access-control';

const VALID_ROLES = new Set(Object.values(APP_ROLES));
const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN?.split(',').map((d) => d.trim().toLowerCase()) || ['gamahospital.com']);
const MANAGEMENT_ROLES = [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAllowedDomainEmail(email: string): boolean {
  return ALLOWED_DOMAIN.includes(email.split('@')[1]);
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

function getActorUserId(sessionUserId: string): number {
  const actorUserId = Number(sessionUserId);
  if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
    throw new Error('Invalid actor session user id');
  }
  return actorUserId;
}

function normalizeReason(reason: unknown): string {
  return typeof reason === 'string' ? reason.trim() : '';
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
    const actorUserId = getActorUserId(session.user.id);

    if (!ACCESS_CONTROL.api.users.canManage(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, updates, reason, confirmHighRisk } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userIdNumber = Number(userId);
    if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
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

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userIdNumber),
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const actorUser = await db.query.users.findFirst({ where: eq(users.id, actorUserId) });
    if (!actorUser) {
      return NextResponse.json({ error: 'Actor user not found' }, { status: 400 });
    }

    if ('roles' in filteredUpdates) {
      const validRoles = validateRoles(filteredUpdates.roles);
      if (!validRoles) {
        return NextResponse.json({ error: 'Invalid roles. Use at least one valid application role.' }, { status: 400 });
      }
      filteredUpdates.roles = validRoles;
    }

    const beforeRoles = existingUser.roles || [];
    const afterRoles = (filteredUpdates.roles as string[] | undefined) || beforeRoles;
    const rolesChanged = JSON.stringify(beforeRoles) !== JSON.stringify(afterRoles);
    const statusChanged = typeof filteredUpdates.isActive === 'boolean' && filteredUpdates.isActive !== existingUser.isActive;

    const actorIsSuperAdmin = (actorUser.roles || []).includes(APP_ROLES.SUPER_ADMIN);
    const targetHasSuperAdminBefore = beforeRoles.includes(APP_ROLES.SUPER_ADMIN);
    const targetHasSuperAdminAfter = afterRoles.includes(APP_ROLES.SUPER_ADMIN);

    if ((targetHasSuperAdminBefore !== targetHasSuperAdminAfter) && !actorIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admin can assign or remove Super Admin role' },
        { status: 403 }
      );
    }

    const targetHasManagementAccess = ACCESS_CONTROL.api.users.canManage(beforeRoles as any);
    const isHighRisk =
      targetHasSuperAdminBefore !== targetHasSuperAdminAfter ||
      (statusChanged && filteredUpdates.isActive === false && targetHasManagementAccess);

    const normalizedReason = normalizeReason(reason);

    if ((rolesChanged || statusChanged) && normalizedReason.length < 10) {
      return NextResponse.json(
        { error: 'Reason is required (minimum 10 characters) for role or status changes' },
        { status: 400 }
      );
    }

    if (isHighRisk && confirmHighRisk !== true) {
      return NextResponse.json(
        { error: 'High-risk change requires explicit confirmation' },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (filteredUpdates.isActive === false && userIdNumber === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Prevent admin from removing own management access
    if (userIdNumber === parseInt(session.user.id) && filteredUpdates.roles) {
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
      .where(eq(users.id, userIdNumber))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const trackedKeys = ['roles', 'department', 'position', 'isActive', 'employeeId'] as const;
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const key of trackedKeys) {
      if (key in filteredUpdates) {
        const fromValue = (existingUser as any)[key];
        const toValue = (updatedUser as any)[key];
        if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
          changes[key] = { from: fromValue, to: toValue };
        }
      }
    }

    await db.insert(userAdminAuditLogs).values({
      targetUserId: updatedUser.id,
      actorUserId,
      action: 'user_updated',
      reason: normalizedReason || null,
      changes: JSON.stringify(changes),
    });

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
    const actorUserId = getActorUserId(session.user.id);

    if (!ACCESS_CONTROL.api.users.canManage(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reason = normalizeReason(body.reason);
    const confirmHighRisk = body.confirmHighRisk === true;

    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);

    if (!isAllowedDomainEmail(email)) {
      return NextResponse.json(
        { error: `User email must be within the approved domain (@${ALLOWED_DOMAIN.join(', @')})` },
        { status: 400 }
      );
    }

    const roles = validateRoles(parsed.data.roles);

    if (!roles) {
      return NextResponse.json(
        { error: 'At least one valid role is required' },
        { status: 400 }
      );
    }

    const actorUser = await db.query.users.findFirst({ where: eq(users.id, actorUserId) });
    if (!actorUser) {
      return NextResponse.json({ error: 'Actor user not found' }, { status: 400 });
    }

    const actorIsSuperAdmin = (actorUser.roles || []).includes(APP_ROLES.SUPER_ADMIN);
    const includesSuperAdmin = roles.includes(APP_ROLES.SUPER_ADMIN);

    if (includesSuperAdmin && !actorIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admin can create users with Super Admin role' },
        { status: 403 }
      );
    }

    if (includesSuperAdmin && !confirmHighRisk) {
      return NextResponse.json(
        { error: 'High-risk role assignment requires explicit confirmation' },
        { status: 400 }
      );
    }

    if ((roles.some((role) => MANAGEMENT_ROLES.includes(role as any)) || includesSuperAdmin) && reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason is required (minimum 10 characters) for privileged role assignment' },
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

    await db.insert(userAdminAuditLogs).values({
      targetUserId: createdUser.id,
      actorUserId,
      action: 'user_created',
      reason: reason || null,
      changes: JSON.stringify({
        email: createdUser.email,
        roles: createdUser.roles,
        department: createdUser.department,
        position: createdUser.position,
        employeeId: createdUser.employeeId,
        isActive: createdUser.isActive,
      }),
    });

    return NextResponse.json({
      success: true,
      data: createdUser,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
