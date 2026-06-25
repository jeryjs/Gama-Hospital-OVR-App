import { db } from '@/db';
import { userEmailOtps, users } from '@/db/schema';
import { handleApiError, ValidationError } from '@/lib/api/middleware';
import {
    STAFF_ID_OTP_MAX_SEND_PER_HOUR,
    STAFF_ID_OTP_RESEND_COOLDOWN_SECONDS,
    STAFF_ID_OTP_TTL_MINUTES,
    generateOtpCode,
    hashOtpCode,
    isAllowedDomainEmail,
    normalizeEmail,
    normalizeEmployeeId,
} from '@/lib/utils/auth/staff-id';
import { sendStaffIdOtpEmail } from '@/lib/utils/mail';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sendOtpSchema = z.object({
    employeeId: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(255),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = sendOtpSchema.safeParse(body);

        if (!parsed.success) {
            throw new ValidationError('Invalid OTP request payload', parsed.error.issues);
        }

        const employeeId = normalizeEmployeeId(parsed.data.employeeId);
        const email = normalizeEmail(parsed.data.email);

        if (!isAllowedDomainEmail(email)) {
            return NextResponse.json(
                { error: 'Email domain is not allowed', code: 'INVALID_EMAIL_DOMAIN' },
                { status: 400 }
            );
        }

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
            return NextResponse.json(
                { error: 'Password already set for this Staff ID', code: 'PASSWORD_ALREADY_SET' },
                { status: 400 }
            );
        }

        const latestOtp = await db.query.userEmailOtps.findFirst({
            where: and(eq(userEmailOtps.userId, user.id), eq(userEmailOtps.employeeId, employeeId)),
            orderBy: [desc(userEmailOtps.createdAt)],
        });

        const now = new Date();

        if (latestOtp) {
            const cooldownMs = STAFF_ID_OTP_RESEND_COOLDOWN_SECONDS * 1000;
            if (now.getTime() - latestOtp.lastSentAt.getTime() < cooldownMs) {
                return NextResponse.json(
                    {
                        error: `Please wait ${STAFF_ID_OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code.`,
                        code: 'OTP_COOLDOWN',
                    },
                    { status: 429 }
                );
            }
        }

        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentOtps = await db
            .select({ id: userEmailOtps.id })
            .from(userEmailOtps)
            .where(and(eq(userEmailOtps.userId, user.id), gte(userEmailOtps.createdAt, oneHourAgo)));

        if (recentOtps.length >= STAFF_ID_OTP_MAX_SEND_PER_HOUR) {
            return NextResponse.json(
                { error: 'Too many OTP requests. Please try again later.', code: 'OTP_RATE_LIMIT' },
                { status: 429 }
            );
        }

        const code = generateOtpCode();
        const codeHash = await hashOtpCode(code);
        const expiresAt = new Date(now.getTime() + STAFF_ID_OTP_TTL_MINUTES * 60 * 1000);

        await db.insert(userEmailOtps).values({
            userId: user.id,
            employeeId,
            email,
            codeHash,
            expiresAt,
            verifiedAt: null,
            attempts: 0,
            sendCount: (latestOtp?.sendCount || 0) + 1,
            lastSentAt: now,
            createdAt: now,
            updatedAt: now,
        });

        await sendStaffIdOtpEmail(email, code);

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            expiresInMinutes: STAFF_ID_OTP_TTL_MINUTES,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
