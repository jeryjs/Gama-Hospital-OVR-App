import { db } from '@/db';
import { ovrComments } from '@/db/schema';
import { requireAuth, handleApiError, validateBody } from '@/lib/api/middleware';
import { createCommentSchema } from '@/lib/api/schemas';
import { authOptions } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    
    const comments = await db.query.ovrComments.findMany({
      where: eq(ovrComments.ovrReportId, parseInt(id)),
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
    const session = await requireAuth(req);
    const { id } = await params;
    
    // Validate request body
    const body = await validateBody(req, createCommentSchema);

    const newComment = await db
      .insert(ovrComments)
      .values({
        ovrReportId: parseInt(id),
        userId: parseInt(session.user.id),
        comment: body.comment.trim(),
      })
      .returning();

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
