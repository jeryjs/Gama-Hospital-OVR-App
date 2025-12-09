/**
 * @fileoverview Shared Access API - Google Forms Style Sharing
 * 
 * Manage email-based shared access invitations
 * - QI invites users via email (bulk or single)
 * - Generates secure access tokens
 * - Tracks invitation status and usage
 */

import { db } from '@/db';
import { ovrSharedAccess, users } from '@/db/schema';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    AuthorizationError,
    handleApiError,
    requireAuth,
    validateBody,
} from '@/lib/api/middleware';
import {
    createSharedAccessSchema,
    bulkCreateSharedAccessSchema,
    revokeSharedAccessSchema,
} from '@/lib/api/schemas';
import { generateSharedAccessToken } from '@/lib/utils';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shared-access - Create single invitation
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.sharedAccess.canCreate(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can manage shared access');
        }

        const body = await validateBody(request, createSharedAccessSchema);

        // Generate secure token
        const { token, expiresAt } = generateSharedAccessToken(30); // 30 days

        // Check if user exists in system
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, body.email))
            .limit(1);

        const [invitation] = await db
            .insert(ovrSharedAccess)
            .values({
                resourceType: body.resourceType,
                resourceId: body.resourceId,
                ovrReportId: body.ovrReportId,
                email: body.email,
                userId: existingUser?.id || null,
                role: body.role,
                accessToken: token,
                tokenExpiresAt: body.tokenExpiresAt
                    ? new Date(body.tokenExpiresAt)
                    : expiresAt,
                status: 'pending',
                invitedBy: parseInt(session.user.id),
                invitedAt: new Date(),
            })
            .returning();

        return NextResponse.json(
            {
                success: true,
                message: 'Invitation created successfully',
                invitation,
                accessUrl: `${process.env.NEXTAUTH_URL}/${body.resourceType}s/${body.resourceId}?token=${token}`,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/shared-access/bulk - Create multiple invitations
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.sharedAccess.canCreate(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can manage shared access');
        }

        const body = await validateBody(request, bulkCreateSharedAccessSchema);

        const invitations = [];
        const invitedBy = parseInt(session.user.id);

        for (const invite of body.invitations) {
            const { token, expiresAt } = generateSharedAccessToken(30);

            // Check if user exists
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, invite.email))
                .limit(1);

            const [invitation] = await db
                .insert(ovrSharedAccess)
                .values({
                    resourceType: body.resourceType,
                    resourceId: body.resourceId,
                    ovrReportId: body.ovrReportId,
                    email: invite.email,
                    userId: existingUser?.id || null,
                    role: invite.role,
                    accessToken: token,
                    tokenExpiresAt: body.tokenExpiresAt
                        ? new Date(body.tokenExpiresAt)
                        : expiresAt,
                    status: 'pending',
                    invitedBy,
                    invitedAt: new Date(),
                })
                .returning();

            invitations.push({
                ...invitation,
                accessUrl: `${process.env.NEXTAUTH_URL}/${body.resourceType}s/${body.resourceId}?token=${token}`,
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: `${invitations.length} invitations created successfully`,
                invitations,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/shared-access - Revoke access
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth(request);

        if (!ACCESS_CONTROL.api.sharedAccess.canRevoke(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can revoke shared access');
        }

        const searchParams = request.nextUrl.searchParams;
        const accessId = searchParams.get('id');

        if (!accessId) {
            throw new Error('Access ID is required');
        }

        const [revoked] = await db
            .update(ovrSharedAccess)
            .set({
                status: 'revoked',
                revokedBy: parseInt(session.user.id),
                revokedAt: new Date(),
            })
            .where(eq(ovrSharedAccess.id, parseInt(accessId)))
            .returning();

        return NextResponse.json({
            success: true,
            message: 'Access revoked successfully',
            access: revoked,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
