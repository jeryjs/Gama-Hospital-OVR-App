import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function dataUriToResponse(dataUri: string): NextResponse {
  const match = dataUri.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = match[1] || 'image/jpeg';
  const buffer = Buffer.from(match[2], 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userId = Number(token?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return new NextResponse(null, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return new NextResponse(null, { status: 404 });
  }

  const profilePicture = user.profilePicture;
  if (profilePicture) {
    if (profilePicture.startsWith('data:')) {
      return dataUriToResponse(profilePicture);
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://') || profilePicture.startsWith('/')) {
      return NextResponse.redirect(new URL(profilePicture, request.url));
    }
  }

  const accessToken = typeof token?.accessToken === 'string' ? token.accessToken : null;
  if (!accessToken) {
    return new NextResponse(null, { status: 404 });
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status === 404 ? 404 : 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

  await db
    .update(users)
    .set({
      profilePicture: dataUri,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
