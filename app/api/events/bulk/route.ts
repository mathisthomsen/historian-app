// app/api/import-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  try {
    const ids = await req.json(); // erwartet z. B. [1, 2, 3]

    if (!Array.isArray(ids) || !ids.every(id => typeof id === 'number')) {
      return NextResponse.json({ error: 'Invalid ID array' }, { status: 400 });
    }

    await prisma.events.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 });
  }
}
