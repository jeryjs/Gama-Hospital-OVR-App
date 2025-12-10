/**
 * @fileoverview User's Draft Incidents API
 * 
 * This endpoint is the ONLY way to retrieve draft incidents.
 * Drafts are ALWAYS private - users can only see their own drafts.
 * 
 * Security: Drafts should NEVER appear in:
 * - /api/incidents (main list)
 * - /api/stats (dashboard stats)
 * - Any other user's view
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import {
    createPaginatedResponse,
    handleApiError,
    requireAuth,
    parseFields,
} from '@/lib/api/middleware';
import { getListColumns, incidentRelations } from '@/lib/api/schemas';
import { and, eq, desc, asc, like, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query params schema for drafts
const draftsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.enum(['createdAt', 'occurrenceDate', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    fields: z.string().optional(),
    search: z.string().optional(),
});

/**
 * GET /api/incidents/drafts
 * Returns ONLY the current user's draft incidents
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request);
        const searchParams = request.nextUrl.searchParams;

        // Parse query params
        const query = draftsQuerySchema.parse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            sortBy: searchParams.get('sortBy'),
            sortOrder: searchParams.get('sortOrder'),
            search: searchParams.get('search') || undefined,
            fields: searchParams.get('fields') || undefined,
        });

        const userId = parseInt(session.user.id);
        const offset = (query.page - 1) * query.limit;

        // Build where conditions - ALWAYS filter by reporterId AND status = 'draft'
        const conditions = [
            eq(ovrReports.reporterId, userId),
            eq(ovrReports.status, 'draft'),
        ];

        // Optional search filter
        if (query.search) {
            conditions.push(
                or(
                    like(ovrReports.id, `%${query.search}%`),
                    like(ovrReports.description, `%${query.search}%`),
                    like(ovrReports.involvedPersonName, `%${query.search}%`)
                ) as any
            );
        }

        const whereClause = and(...conditions);

        // Sort configuration
        const sortColumn = {
            createdAt: ovrReports.createdAt,
            occurrenceDate: ovrReports.occurrenceDate,
            updatedAt: ovrReports.updatedAt,
        }[query.sortBy];

        const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(ovrReports)
            .where(whereClause);

        const total = Number(countResult[0].count);

        const columns = parseFields(query.fields) || getListColumns();

        // Fetch drafts with relations
        const drafts = await db.query.ovrReports.findMany({
            where: whereClause,
            limit: query.limit,
            offset,
            orderBy,
            columns,
            with: {
                reporter: incidentRelations.reporter,
                location: incidentRelations.location,
            },
        });

        return NextResponse.json(
            createPaginatedResponse(drafts, total, {
                page: query.page,
                limit: query.limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
            })
        );
    } catch (error) {
        return handleApiError(error);
    }
}
