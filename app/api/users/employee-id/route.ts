import { db } from '@/db';
import { users } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { and, ne, sql, type SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    if (!ACCESS_CONTROL.api.users.canView(session.user.roles)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const employeeId = request.nextUrl.searchParams.get('employeeId')?.trim();
    const excludeUserIdParam = request.nextUrl.searchParams.get('excludeUserId');

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const conditions: SQL[] = [
      sql`LOWER(${users.employeeId}) = ${employeeId.toLowerCase()}`,
    ];

    const excludeUserId = Number(excludeUserIdParam);
    if (Number.isInteger(excludeUserId) && excludeUserId > 0) {
      conditions.push(ne(users.id, excludeUserId));
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(...conditions))
      .limit(1);

    return NextResponse.json({ available: !existing });
  } catch (error) {
    return handleApiError(error);
  }
}
