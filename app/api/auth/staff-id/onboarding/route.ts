import { db } from '@/db';
import { departments, users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import { isBlankText, normalizeEmployeeId } from '@/lib/utils/auth/staff-id';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const onboardingSchema = z.object({
    employeeId: z.string().trim().min(1).max(50),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    departmentId: z.number().int().positive().optional().nullable(),
    unitId: z.number().int().positive().optional().nullable(),
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

function enforceLockedIdField(fieldLabel: string, currentValue: number | null | undefined, incomingValue: number | null | undefined): void {
    if (!currentValue) {
        return;
    }

    if (incomingValue !== currentValue) {
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
        enforceLockedIdField('Department', user.departmentId, parsed.data.departmentId);
        enforceLockedIdField('Unit', user.unitId, parsed.data.unitId);
        enforceLockedField('Position', user.position, parsed.data.position);

        const nextFirstName = isBlankText(user.firstName)
            ? parsed.data.firstName?.trim() || ''
            : user.firstName;

        const nextLastName = isBlankText(user.lastName)
            ? parsed.data.lastName?.trim() || ''
            : user.lastName;

        const nextDepartmentId = user.departmentId || parsed.data.departmentId || null;
        const nextUnitId = user.unitId || parsed.data.unitId || null;

        if (nextDepartmentId) {
            const department = await db.query.departments.findFirst({
                where: and(eq(departments.id, nextDepartmentId), isNull(departments.parentDepartmentId), eq(departments.isActive, true)),
                columns: { id: true },
            });

            if (!department) {
                throw new ValidationError('Invalid department selected');
            }
        }

        if (nextUnitId) {
            const unit = await db.query.departments.findFirst({
                where: and(
                    eq(departments.id, nextUnitId),
                    isNotNull(departments.parentDepartmentId),
                    eq(departments.isActive, true)
                ),
                columns: { id: true, parentDepartmentId: true },
            });

            if (!unit || (nextDepartmentId && unit.parentDepartmentId !== nextDepartmentId)) {
                throw new ValidationError('Invalid unit selected for department');
            }
        }

        const nextPosition = isBlankText(user.position)
            ? parsed.data.position?.trim() || null
            : user.position;

        const passwordHash = await bcrypt.hash(parsed.data.password, 10);

        await db
            .update(users)
            .set({
                firstName: nextFirstName,
                lastName: nextLastName,
                departmentId: nextDepartmentId,
                unitId: nextUnitId,
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
