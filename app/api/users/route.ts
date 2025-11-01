import { db } from '@/db';
import { users } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role');
    const department = searchParams.get('department');

    const query = db
      .select({
        id: users.id,
        name: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isActive, true));

    const allUsers = await query;

    // Filter by role if provided
    let filteredUsers = allUsers;
    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    // Filter by department if provided
    if (department) {
      filteredUsers = filteredUsers.filter(u => u.department === department);
    }

    // Format for display
    const formattedUsers = filteredUsers.map(u => ({
      id: u.id,
      name: `${u.name} ${u.lastName}`,
      email: u.email,
      department: u.department,
      role: u.role,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
