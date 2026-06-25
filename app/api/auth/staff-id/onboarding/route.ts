import { db } from '@/db';
import { users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import { isBlankText, normalizeEmployeeId } from '@/lib/utils/auth/staff-id';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const onboardingSchema = z.object({
    employeeId: z.string().trim().min(1).max(50),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    department: z.string().trim().max(100).optional(),
    unit: z.string().trim().max(100).optional(),
    position: z.string().trim().max(100).optional(),
});

function enforceLockedField(
    fieldLabel: string,
    currentValue: string | null | undefined,
    incomingValue: string | undefined
): void {
    if (isBlankText(currentValue)) {
        return;
    }

    const current = currentValue?.trim() || '';
    const incoming = incomingValue?.trim() || '';

    if (incoming !== current) {
        throw new ValidationError(`${fieldLabel} cannot be changed because it is already set`);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = onboardingSchema.safeParse(body);

        if (!parsed.success) {
            throw new ValidationError('Invalid onboarding payload', parsed.error.issues);
        }

        const employeeId = normalizeEmployeeId(parsed.data.employeeId);
        const user = await db.query.users.findFirst({
            where: sql`LOWER(${users.employeeId}) = ${employeeId}`,
        });

        if (!user) {
            return NextResponse.json({ error: 'Staff ID not found', code: 'STAFF_ID_NOT_FOUND' }, { status: 404 });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' }, { status: 403 });
        }

        if (user.passwordHash) {
            return NextResponse.json({ error: 'Password already set for this user', code: 'PASSWORD_ALREADY_SET' }, { status: 400 });
        }

        if (!user.emailVerifiedAt) {
            return NextResponse.json(
                { error: 'Email verification is required before setting password', code: 'EMAIL_NOT_VERIFIED' },
                { status: 400 }
            );
        }

        enforceLockedField('First name', user.firstName, parsed.data.firstName);
        enforceLockedField('Last name', user.lastName, parsed.data.lastName);
        enforceLockedField('Department', user.department, parsed.data.department);
        enforceLockedField('Unit', user.unit, parsed.data.unit);
        enforceLockedField('Position', user.position, parsed.data.position);

        const nextFirstName = isBlankText(user.firstName)
            ? parsed.data.firstName?.trim() || ''
            : user.firstName;

        const nextLastName = isBlankText(user.lastName)
            ? parsed.data.lastName?.trim() || ''
            : user.lastName;

        const nextDepartment = isBlankText(user.department)
            ? parsed.data.department?.trim() || null
            : user.department;

        const nextUnit = isBlankText(user.unit)
            ? parsed.data.unit?.trim() || ''
            : user.unit;

        const nextPosition = isBlankText(user.position)
            ? parsed.data.position?.trim() || null
            : user.position;

        const passwordHash = await bcrypt.hash(parsed.data.password, 10);

        await db
            .update(users)
            .set({
                firstName: nextFirstName,
                lastName: nextLastName,
                department: nextDepartment,
                unit: nextUnit,
                position: nextPosition,
                passwordHash,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
