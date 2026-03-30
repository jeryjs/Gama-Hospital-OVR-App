import { db } from '@/db';
import { ovrReports, userAdminAuditLogs, users } from '@/db/schema';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { desc, eq, inArray, sql } from 'drizzle-orm';
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

        const { searchParams } = new URL(request.url);
        const userId = Number(searchParams.get('userId'));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));

        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
        }

        const logs = await db
            .select()
            .from(userAdminAuditLogs)
            .where(eq(userAdminAuditLogs.targetUserId, userId))
            .orderBy(desc(userAdminAuditLogs.createdAt))
            .limit(limit);

        const actorIds = [...new Set(logs.map((log) => log.actorUserId))];

        const actors = actorIds.length > 0
            ? await db
                .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                })
                .from(users)
                .where(inArray(users.id, actorIds))
            : [];

        const actorMap = new Map(
            actors.map((actor) => [
                actor.id,
                {
                    name: `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email,
                    email: actor.email,
                },
            ])
        );

        const data = logs.map((log) => ({
            id: log.id,
            action: log.action,
            reason: log.reason,
            changes: (() => {
                try {
                    return JSON.parse(log.changes || '{}');
                } catch {
                    return {};
                }
            })(),
            createdAt: log.createdAt,
            actor: actorMap.get(log.actorUserId) || {
                name: `User #${log.actorUserId}`,
                email: null,
            },
        }));

        const [summary] = await db
            .select({
                totalIncidentsReported: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} != 'draft')::int`,
                incidentsInProgress: sql<number>`COUNT(*) FILTER (WHERE ${ovrReports.status} IN ('submitted', 'qi_review', 'investigating', 'qi_final_actions'))::int`,
            })
            .from(ovrReports)
            .where(eq(ovrReports.reporterId, userId));

        return NextResponse.json({
            data,
            summary: {
                totalIncidentsReported: summary?.totalIncidentsReported || 0,
                incidentsInProgress: summary?.incidentsInProgress || 0,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
