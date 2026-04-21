import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory cache: userId -> { buffer, contentType, etag, fetchedAt }
const avatarCache = new Map<number, {
  buffer: Buffer;
  contentType: string;
  etag: string;
  fetchedAt: number;
}>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function generateETag(buffer: Buffer): string {
  return `"${createHash('sha256').update(buffer).digest('hex').slice(0, 16)}"`;
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

  // Check in-memory cache first
  const cached = avatarCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === cached.etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'ETag': cached.etag,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Try to fetch from Microsoft Graph
  const accessToken = typeof token?.accessToken === 'string' ? token.accessToken : null;
  if (!accessToken) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const etag = generateETag(buffer);

    // Cache in memory
    avatarCache.set(userId, {
      buffer,
      contentType,
      etag,
      fetchedAt: Date.now(),
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'ETag': etag,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return new NextResponse(null, { status: 204 });
  }
}
