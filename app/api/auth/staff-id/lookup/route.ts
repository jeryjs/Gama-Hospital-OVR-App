import { db } from '@/db';
import { departments, users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import { canEditField, getDisplayName, normalizeEmployeeId } from '@/lib/utils/auth/staff-id';
import { getDepartmentUnitLabels } from '@/lib/utils/users';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
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
        const labels = await getDepartmentUnitLabels(user.departmentId, user.unitId);
        const departmentOptions = await db.query.departments.findMany({
            where: and(eq(departments.isActive, true), isNull(departments.parentDepartmentId)),
            orderBy: [asc(departments.name)],
            columns: { id: true, name: true },
            with: {
                units: {
                    where: eq(departments.isActive, true),
                    orderBy: [asc(departments.name)],
                    columns: { id: true, name: true, parentDepartmentId: true },
                },
            },
        });

        return NextResponse.json({
            employeeId: user.employeeId,
            hasPassword,
            needsOnboarding: !hasPassword,
            profile: {
                name: getDisplayName(user.firstName, user.lastName),
                firstName: user.firstName,
                lastName: user.lastName,
                department: labels.department || '',
                departmentId: user.departmentId,
                unit: labels.unit || '',
                unitId: user.unitId,
                position: user.position || '',
                email: user.email || '',
                emailVerified: Boolean(user.emailVerifiedAt),
            },
            editable: {
                firstName: canEditField(user.firstName),
                lastName: canEditField(user.lastName),
                department: !user.departmentId,
                unit: !user.unitId,
                position: canEditField(user.position),
                email: !user.emailVerifiedAt,
            },
            options: {
                departments: departmentOptions.map((department) => ({
                    id: department.id,
                    name: department.name,
                    units: (department as any).units || [],
                })),
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
