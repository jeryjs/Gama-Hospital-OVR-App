import { db } from '@/db';
import {
    departments,
    locations,
    ovrCorrectiveActions,
    ovrInvestigations,
    ovrReports,
    users,
} from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { AuthorizationError, handleApiError, requireAuth } from '@/lib/api/middleware';
import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const recommendedParamsSchema = z.object({
    ovrReportId: z.string().min(1),
    resourceType: z.enum(['investigation', 'corrective_action']).optional(),
    resourceId: z.coerce.number().int().positive().optional(),
});

type RecommendationReason =
    | 'department_head'
    | 'reporter'
    | 'involved_person'
    | 'resource_member'
    | 'resource_owner';

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.sharedAccess.canCreate(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can manage shared access');
        }

        const { searchParams } = new URL(request.url);
        const params = recommendedParamsSchema.parse({
            ovrReportId: searchParams.get('ovrReportId') || undefined,
            resourceType: searchParams.get('resourceType') || undefined,
            resourceId: searchParams.get('resourceId') || undefined,
        });

        const [incident] = await db
            .select({
                reporterId: ovrReports.reporterId,
                involvedStaffId: ovrReports.involvedStaffId,
                locationId: ovrReports.locationId,
            })
            .from(ovrReports)
            .where(eq(ovrReports.id, params.ovrReportId))
            .limit(1);

        if (!incident) {
            return NextResponse.json([]);
        }

        let departmentHeadId: number | null = null;

        if (incident.locationId) {
            const [locationWithDepartment] = await db
                .select({
                    headOfDepartment: departments.headOfDepartment,
                })
                .from(locations)
                .leftJoin(departments, eq(locations.departmentId, departments.id))
                .where(eq(locations.id, incident.locationId))
                .limit(1);

            departmentHeadId = locationWithDepartment?.headOfDepartment ?? null;
        }

        const recommendations = new Map<number, RecommendationReason>();

        const addRecommendation = (
            userId: number | null | undefined,
            reason: RecommendationReason
        ) => {
            if (!userId || recommendations.has(userId)) {
                return;
            }

            recommendations.set(userId, reason);
        };

        addRecommendation(departmentHeadId, 'department_head');
        addRecommendation(incident.reporterId, 'reporter');
        addRecommendation(incident.involvedStaffId, 'involved_person');

        if (params.resourceType === 'investigation' && params.resourceId) {
            const [investigation] = await db
                .select({
                    investigators: ovrInvestigations.investigators,
                    createdBy: ovrInvestigations.createdBy,
                })
                .from(ovrInvestigations)
                .where(
                    and(
                        eq(ovrInvestigations.id, params.resourceId),
                        eq(ovrInvestigations.ovrReportId, params.ovrReportId)
                    )
                )
                .limit(1);

            if (investigation) {
                for (const userId of investigation.investigators || []) {
                    addRecommendation(userId, 'resource_member');
                }
                addRecommendation(investigation.createdBy, 'resource_owner');
            }
        }

        if (params.resourceType === 'corrective_action' && params.resourceId) {
            const [action] = await db
                .select({
                    assignedTo: ovrCorrectiveActions.assignedTo,
                    createdBy: ovrCorrectiveActions.createdBy,
                })
                .from(ovrCorrectiveActions)
                .where(
                    and(
                        eq(ovrCorrectiveActions.id, params.resourceId),
                        eq(ovrCorrectiveActions.ovrReportId, params.ovrReportId)
                    )
                )
                .limit(1);

            if (action) {
                for (const userId of action.assignedTo || []) {
                    addRecommendation(userId, 'resource_member');
                }
                addRecommendation(action.createdBy, 'resource_owner');
            }
        }

        const recommendedIds = Array.from(recommendations.keys());

        if (!recommendedIds.length) {
            return NextResponse.json([]);
        }

        const foundUsers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                department: users.department,
                position: users.position,
                profilePicture: users.profilePicture,
                roles: users.roles,
            })
            .from(users)
            .where(and(inArray(users.id, recommendedIds), eq(users.isActive, true)));

        const reasonRank: Record<RecommendationReason, number> = {
            department_head: 0,
            reporter: 1,
            involved_person: 2,
            resource_owner: 3,
            resource_member: 4,
        };

        const orderedUsers = foundUsers
            .map((user) => ({
                ...user,
                recommendationReason: recommendations.get(user.id)!,
            }))
            .sort((a, b) => {
                const rankDiff =
                    reasonRank[a.recommendationReason] - reasonRank[b.recommendationReason];

                if (rankDiff !== 0) {
                    return rankDiff;
                }

                const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();

                return nameA.localeCompare(nameB);
            });

        return NextResponse.json(orderedUsers, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}