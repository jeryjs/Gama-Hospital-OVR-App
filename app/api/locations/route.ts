import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { locations } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allLocations = await db.query.locations.findMany({
      orderBy: (locations, { asc }) => [asc(locations.name)],
    });

    return NextResponse.json(allLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const newLocation = await db.insert(locations).values({
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
    }).returning();

    return NextResponse.json(newLocation[0], { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
