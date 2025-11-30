import { db } from '@/db';
import { ovrComments } from '@/db/schema';
import { AuthorizationError, handleApiError, NotFoundError, requireAuth, validateBody } from '@/lib/api/middleware';
import { updateCommentSchema } from '@/lib/api/schemas';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { APP_ROLES } from '@/lib/constants';
import { hasAnyRole } from '@/lib/auth-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { commentId } = await params;

    const comment = await db.query.ovrComments.findFirst({
      where: eq(ovrComments.id, parseInt(commentId)),
    });

    if (!comment) {
      throw new NotFoundError('Comment');
    }

    // Only comment owner can edit
    if (comment.userId.toString() !== session.user.id) {
      throw new AuthorizationError('You can only edit your own comments');
    }

    // Validate request body
    const body = await validateBody(req, updateCommentSchema);

    const updatedComment = await db
      .update(ovrComments)
      .set({
        comment: body.comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(ovrComments.id, parseInt(commentId)))
      .returning();

    // Fetch the comment with user details
    const commentWithUser = await db.query.ovrComments.findFirst({
      where: eq(ovrComments.id, updatedComment[0].id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    return NextResponse.json(commentWithUser);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { commentId } = await params;

    const comment = await db.query.ovrComments.findFirst({
      where: eq(ovrComments.id, parseInt(commentId)),
    });

    if (!comment) {
      throw new NotFoundError('Comment');
    }

    // Only comment owner or privileged users can delete
    const canDelete =
      comment.userId.toString() === session.user.id ||
      hasAnyRole(session.user.roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.QUALITY_MANAGER, APP_ROLES.DEVELOPER]);

    if (!canDelete) {
      throw new AuthorizationError('You can only delete your own comments');
    }

    await db.delete(ovrComments).where(eq(ovrComments.id, parseInt(commentId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
