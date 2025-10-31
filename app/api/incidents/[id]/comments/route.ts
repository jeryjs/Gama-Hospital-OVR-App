import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { ovrComments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const newComment = await db
      .insert(ovrComments)
      .values({
        ovrReportId: parseInt(id),
        userId: parseInt(session.user.id),
        comment: content.trim(),
      })
      .returning();

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
