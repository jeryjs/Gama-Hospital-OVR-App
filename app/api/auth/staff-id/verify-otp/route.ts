import { db } from '@/db';
import { userEmailOtps, users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import {
    STAFF_ID_OTP_MAX_ATTEMPTS,
    compareOtpCode,
    normalizeEmail,
    normalizeEmployeeId,
} from '@/lib/utils/auth/staff-id';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifyOtpSchema = z.object({
    employeeId: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(255),
    code: z.string().trim().length(6),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = verifyOtpSchema.safeParse(body);

        if (!parsed.success) {
            throw new ValidationError('Invalid OTP verification payload', parsed.error.issues);
        }

        const employeeId = normalizeEmployeeId(parsed.data.employeeId);
        const email = normalizeEmail(parsed.data.email);

        const user = await db.query.users.findFirst({
            where: sql`LOWER(${users.employeeId}) = ${employeeId}`,
        });

        if (!user) {
            return NextResponse.json({ error: 'Staff ID not found', code: 'STAFF_ID_NOT_FOUND' }, { status: 404 });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' }, { status: 403 });
        }

        const otpRow = await db.query.userEmailOtps.findFirst({
            where: and(
                eq(userEmailOtps.userId, user.id),
                eq(userEmailOtps.employeeId, employeeId),
                eq(userEmailOtps.email, email),
                isNull(userEmailOtps.verifiedAt)
            ),
            orderBy: [desc(userEmailOtps.createdAt)],
        });

        if (!otpRow) {
            return NextResponse.json({ error: 'No active OTP found for this email', code: 'OTP_NOT_FOUND' }, { status: 404 });
        }

        const now = new Date();

        if (otpRow.expiresAt.getTime() < now.getTime()) {
            return NextResponse.json({ error: 'OTP has expired', code: 'OTP_EXPIRED' }, { status: 400 });
        }

        if (otpRow.attempts >= STAFF_ID_OTP_MAX_ATTEMPTS) {
            return NextResponse.json(
                { error: 'Maximum OTP attempts exceeded. Please request a new code.', code: 'OTP_ATTEMPTS_EXCEEDED' },
                { status: 429 }
            );
        }

        const isValidCode = await compareOtpCode(parsed.data.code, otpRow.codeHash);

        if (!isValidCode) {
            await db
                .update(userEmailOtps)
                .set({ attempts: otpRow.attempts + 1, updatedAt: now })
                .where(eq(userEmailOtps.id, otpRow.id));

            return NextResponse.json({ error: 'Invalid OTP code', code: 'OTP_INVALID' }, { status: 400 });
        }

        await db
            .update(userEmailOtps)
            .set({ verifiedAt: now, updatedAt: now })
            .where(eq(userEmailOtps.id, otpRow.id));

        await db
            .update(users)
            .set({
                email,
                emailVerifiedAt: now,
                updatedAt: now,
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true, verified: true });
    } catch (error) {
        return handleApiError(error);
    }
}
