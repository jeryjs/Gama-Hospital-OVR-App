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
    validateCsrfAndIdempotency,
    validateBody,
} from '@/lib/api/middleware';
import {
    acceptSharedAccessSchema,
    createSharedAccessSchema,
    bulkCreateSharedAccessSchema,
} from '@/lib/api/schemas';
import { buildSharedAccessUrl, generateSharedAccessToken } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shared-access - Create single invitation
 */
export async function POST(request: NextRequest) {
    try {
        const session = await validateCsrfAndIdempotency(request);

        if (!ACCESS_CONTROL.api.sharedAccess.canCreate(session.user.roles)) {
            throw new AuthorizationError('Only QI staff can manage shared access');
        }

        const body = await validateBody(request, createSharedAccessSchema);
        const normalizedEmail = body.email.trim().toLowerCase();

        // Generate secure token
        const { token, expiresAt } = generateSharedAccessToken(30); // 30 days

        // Check if user exists in system
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        const [invitation] = await db
            .insert(ovrSharedAccess)
            .values({
                resourceType: body.resourceType,
                resourceId: body.resourceId,
                ovrReportId: body.ovrReportId,
                email: normalizedEmail,
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

        const accessUrl = buildSharedAccessUrl(
            body.resourceType,
            body.resourceId,
            token,
            process.env.NEXTAUTH_URL
        );

        await sendWorkflowMailSafely(request, session.user, 'shared_access_invited', {
            incidentId: body.ovrReportId,
            resourceType: body.resourceType,
            resourceId: body.resourceId,
            inviteeEmail: normalizedEmail,
            role: body.role,
            accessUrl,
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Invitation created successfully',
                invitation,
                accessUrl,
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

        const invitations = [] as (typeof ovrSharedAccess.$inferInsert & { accessUrl: string })[];
        const invitedBy = parseInt(session.user.id);

        for (const invite of body.invitations) {
            const { token, expiresAt } = generateSharedAccessToken(30);
            const normalizedEmail = invite.email.trim().toLowerCase();

            // Check if user exists
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, normalizedEmail))
                .limit(1);

            const [invitation] = await db
                .insert(ovrSharedAccess)
                .values({
                    resourceType: body.resourceType,
                    resourceId: body.resourceId,
                    ovrReportId: body.ovrReportId,
                    email: normalizedEmail,
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

            const accessUrl = buildSharedAccessUrl(
                body.resourceType,
                body.resourceId,
                token,
                process.env.NEXTAUTH_URL
            );

            await sendWorkflowMailSafely(request, session.user, 'shared_access_invited', {
                incidentId: body.ovrReportId,
                resourceType: body.resourceType,
                resourceId: body.resourceId,
                inviteeEmail: normalizedEmail,
                role: invite.role,
                accessUrl,
            });

            invitations.push({
                ...invitation,
                accessUrl,
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
 * PATCH /api/shared-access - Accept invitation by token
 * Requires authenticated session and strict account/email match with invitation
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await validateBody(request, acceptSharedAccessSchema);
        const session = await requireAuth(request);
        const sessionUserId = parseInt(session.user.id);
        const sessionEmail = session.user.email?.trim().toLowerCase();

        if (!sessionEmail) {
            throw new AuthorizationError('Authenticated account must have an email address');
        }

        const [invitation] = await db
            .select()
            .from(ovrSharedAccess)
            .where(eq(ovrSharedAccess.accessToken, body.token))
            .limit(1);

        if (!invitation || invitation.status === 'revoked') {
            throw new AuthorizationError('Invalid or revoked shared access token');
        }

        const now = new Date();
        if (invitation.tokenExpiresAt && new Date(invitation.tokenExpiresAt) <= now) {
            throw new AuthorizationError('Shared access token has expired');
        }

        const inviteEmail = invitation.email.trim().toLowerCase();
        const userMatches = invitation.userId ? invitation.userId === sessionUserId : true;
        const emailMatches = inviteEmail === sessionEmail;

        if (!userMatches || !emailMatches) {
            throw new AuthorizationError('This invitation was issued for a different account');
        }

        const shouldAccept = invitation.status === 'pending';

        const [accepted] = await db
            .update(ovrSharedAccess)
            .set({
                status: shouldAccept ? 'accepted' : invitation.status,
                email: inviteEmail,
                userId: sessionUserId,
                lastAccessedAt: now,
            })
            .where(eq(ovrSharedAccess.id, invitation.id))
            .returning();

        return NextResponse.json({
            success: true,
            message: shouldAccept ? 'Invitation accepted' : 'Invitation already active',
            access: accepted,
        });
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
