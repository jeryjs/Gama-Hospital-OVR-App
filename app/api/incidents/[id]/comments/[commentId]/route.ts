import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { ovrComments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    
    const comment = await db.query.ovrComments.findFirst({
      where: eq(ovrComments.id, parseInt(commentId)),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only comment owner or admin can delete
    if (comment.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.delete(ovrComments).where(eq(ovrComments.id, parseInt(commentId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
