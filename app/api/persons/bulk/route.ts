// app/api/import-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';
const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  try {
    const ids = await req.json(); // erwartet z. B. [1, 2, 3]

    if (!Array.isArray(ids) || !ids.every(id => typeof id === 'number')) {
      return NextResponse.json({ error: 'Invalid ID array' }, { status: 400 });
    }

    // Only delete persons belonging to the current user
    await prisma.persons.deleteMany({
      where: { id: { in: ids }, userId: localUser.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 });
  }
}
