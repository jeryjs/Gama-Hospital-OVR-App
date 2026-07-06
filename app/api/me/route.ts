import { db } from '@/db';
import { userNotificationPreferences, users } from '@/db/schema';
import { handleApiError, requireAuth, validateBody, validateCsrfAndIdempotency } from '@/lib/api/middleware';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { type WorkflowNotificationEvent } from '@/lib/utils/notifications';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const VALID_EVENTS = ACCESS_CONTROL.notifications.categories.map((c) => c.event) as [
    WorkflowNotificationEvent,
    ...WorkflowNotificationEvent[]
];

const updatePreferencesSchema = z.object({
    preferences: z.array(
        z.object({
            event: z.enum(VALID_EVENTS),
            inApp: z.boolean(),
            mail: z.boolean(),
        })
    ).min(1).max(VALID_EVENTS.length),
});

/** GET /api/me — returns the current user's profile and notification preferences */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request);
        const userId = Number(session.user.id);

        const [userRow, preferences] = await Promise.all([
            db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    employeeId: true,
                    roles: true,
                    departmentId: true,
                    unitId: true,
                    position: true,
                    emailVerifiedAt: true,
                    isActive: true,
                },
                with: {
                    department: { columns: { id: true, name: true } },
                    unit: { columns: { id: true, name: true } },
                },
            }),
            db
                .select({ event: userNotificationPreferences.event, inApp: userNotificationPreferences.inApp, mail: userNotificationPreferences.mail })
                .from(userNotificationPreferences)
                .where(eq(userNotificationPreferences.userId, userId)),
        ]);

        if (!userRow) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: userRow,
            notificationPreferences: preferences,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

/** PATCH /api/me — upsert notification preferences */
export async function PATCH(request: NextRequest) {
    try {
        const session = await validateCsrfAndIdempotency(request);
        const userId = Number(session.user.id);
        const body = await validateBody(request, updatePreferencesSchema);

        const now = new Date();
        await db
            .insert(userNotificationPreferences)
            .values(
                body.preferences.map((p) => ({
                    userId,
                    event: p.event,
                    inApp: p.inApp,
                    mail: p.mail,
                    createdAt: now,
                    updatedAt: now,
                }))
            )
            .onConflictDoUpdate({
                target: [userNotificationPreferences.userId, userNotificationPreferences.event],
                set: {
                    inApp: sql`excluded.in_app`,
                    mail: sql`excluded.mail`,
                    updatedAt: now,
                },
            });

        const updated = await db
            .select({ event: userNotificationPreferences.event, inApp: userNotificationPreferences.inApp, mail: userNotificationPreferences.mail })
            .from(userNotificationPreferences)
            .where(
                and(
                    eq(userNotificationPreferences.userId, userId),
                    inArray(userNotificationPreferences.event, body.preferences.map((p) => p.event))
                )
            );

        return NextResponse.json({ notificationPreferences: updated });
    } catch (error) {
        return handleApiError(error);
    }
}
