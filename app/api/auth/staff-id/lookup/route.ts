import { db } from '@/db';
import { users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import { canEditField, getDisplayName, normalizeEmployeeId } from '@/lib/utils/auth/staff-id';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const staffIdLookupSchema = z.object({
    employeeId: z.string().trim().min(1, 'Staff ID is required').max(50),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = staffIdLookupSchema.safeParse(body);

        if (!parsed.success) {
            throw new ValidationError('Invalid lookup payload', parsed.error.issues);
        }

        const employeeId = normalizeEmployeeId(parsed.data.employeeId);

        const user = await db.query.users.findFirst({
            where: sql`LOWER(${users.employeeId}) = ${employeeId}`,
        });

        if (!user) {
            return NextResponse.json(
                {
                    error: 'Staff ID not found. You may be a new employee not yet added by the Quality Department, or the Staff ID is incorrect.',
                    code: 'STAFF_ID_NOT_FOUND',
                },
                { status: 404 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'This account is inactive. Please contact Quality Department.', code: 'ACCOUNT_INACTIVE' },
                { status: 403 }
            );
        }

        const hasPassword = Boolean(user.passwordHash);

        return NextResponse.json({
            employeeId: user.employeeId,
            hasPassword,
            needsOnboarding: !hasPassword,
            profile: {
                name: getDisplayName(user.firstName, user.lastName),
                firstName: user.firstName,
                lastName: user.lastName,
                department: user.department || '',
                unit: user.unit || '',
                position: user.position || '',
                email: user.email || '',
                emailVerified: Boolean(user.emailVerifiedAt),
            },
            editable: {
                firstName: canEditField(user.firstName),
                lastName: canEditField(user.lastName),
                department: canEditField(user.department),
                unit: canEditField(user.unit),
                position: canEditField(user.position),
                email: !user.emailVerifiedAt,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
