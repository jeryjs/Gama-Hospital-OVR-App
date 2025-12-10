/**
 * @fileoverview User Search API - Optimized for People Picker
 * 
 * GET /api/users/search?q=query&limit=10&roles=qi,admin
 * Fast, debounce-friendly search across user fields
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { handleApiError, requireAuth } from '@/lib/api/middleware';
import { and, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Query parameters schema
const searchParamsSchema = z.object({
    q: z.string().max(100).optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    roles: z.string().optional(), // Comma-separated roles
});

export async function GET(request: NextRequest) {
    try {
        // Require authentication
        await requireAuth(request);

        const { searchParams } = new URL(request.url);

        // Parse and validate query params
        const params = searchParamsSchema.parse({
            q: searchParams.get('q') || undefined,
            limit: searchParams.get('limit') || 10,
            roles: searchParams.get('roles') || undefined,
        });

        // Build WHERE conditions
        const conditions: SQL[] = [eq(users.isActive, true)];

        // Search query across multiple fields using ILIKE
        if (params.q && params.q.trim().length > 0) {
            const searchTerm = `%${params.q.trim()}%`;
            conditions.push(
                or(
                    ilike(users.firstName, searchTerm),
                    ilike(users.lastName, searchTerm),
                    ilike(users.email, searchTerm),
                    ilike(users.employeeId, searchTerm),
                    // Also search full name (firstName + lastName)
                    sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchTerm}`
                )!
            );
        }

        // Filter by roles if specified (user must have ANY of the specified roles)
        if (params.roles) {
            const targetRoles = params.roles.split(',').map(r => r.trim()).filter(Boolean);
            if (targetRoles.length > 0) {
                // PostgreSQL: roles array overlaps with target roles array
                conditions.push(
                    sql`${users.roles}::text[] && ARRAY[${sql.join(targetRoles.map(r => sql`${r}`), sql`, `)}]::text[]`
                );
            }
        }

        // Execute query with minimal fields for performance
        const results = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                department: users.department,
                profilePicture: users.profilePicture,
                roles: users.roles,
            })
            .from(users)
            .where(and(...conditions))
            .limit(params.limit)
            .orderBy(users.firstName, users.lastName);

        // Return with cache headers for 5 minutes
        return NextResponse.json(results, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
