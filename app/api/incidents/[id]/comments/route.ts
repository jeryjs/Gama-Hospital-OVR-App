import { db } from '@/db';
import { ovrComments } from '@/db/schema';
import { handleApiError, requireAuth, validateCsrfAndIdempotency, validateBody } from '@/lib/api/middleware';
import { createCommentSchema } from '@/lib/api/schemas';
import { getIncidentSecure } from '@/lib/utils';
import { sendWorkflowMailSafely } from '@/lib/utils/mail';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    await getIncidentSecure(id, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    const comments = await db.query.ovrComments.findMany({
      where: eq(ovrComments.ovrReportId, id),
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
      orderBy: [desc(ovrComments.createdAt)],
    });

    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateCsrfAndIdempotency(req);
    const { id } = await params;

    await getIncidentSecure(id, {
      userId: parseInt(session.user.id),
      roles: session.user.roles,
      email: session.user.email,
    });

    // Validate request body
    const body = await validateBody(req, createCommentSchema);

    const newComment = await db
      .insert(ovrComments)
      .values({
        ovrReportId: id,
        userId: parseInt(session.user.id),
        comment: body.comment.trim(),
      })
      .returning();

    await sendWorkflowMailSafely(req, session.user, 'incident_commented', {
      incidentId: id,
      commentPreview: body.comment.trim(),
    });

    // Fetch the comment with user details
    const commentWithUser = await db.query.ovrComments.findFirst({
      where: eq(ovrComments.id, newComment[0].id),
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

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
