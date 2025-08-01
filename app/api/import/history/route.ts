import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);

    const { searchParams } = new URL(req.url);
    const importType = searchParams.get('type'); // 'persons' or 'events'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: localUser.id
    };

    if (importType) {
      where.import_type = importType;
    }

    const [imports, total] = await Promise.all([
      prisma.import_history.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.import_history.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.import_history.aggregate({
      where,
      _sum: {
        total_records: true,
        imported_count: true,
        error_count: true,
        skipped_count: true,
        processing_time: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        imports,
        total,
        stats: {
          totalImports: stats._count.id,
          totalRecords: stats._sum.total_records || 0,
          totalImported: stats._sum.imported_count || 0,
          totalErrors: stats._sum.error_count || 0,
          totalSkipped: stats._sum.skipped_count || 0,
          averageProcessingTime: stats._sum.processing_time 
            ? Math.round(stats._sum.processing_time / stats._count.id)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching import history:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch import history' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);

    const data = await req.json();
    
    const importRecord = await prisma.import_history.create({
      data: {
        userId: localUser.id,
        import_type: data.import_type,
        batch_id: data.batch_id,
        file_name: data.file_name,
        total_records: data.total_records,
        imported_count: data.imported_count,
        error_count: data.error_count,
        skipped_count: data.skipped_count,
        processing_time: data.processing_time,
        status: data.status,
        error_details: data.error_details
      }
    });

    return NextResponse.json({
      success: true,
      data: importRecord
    });

  } catch (error) {
    console.error('Error creating import history:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create import history' 
    }, { status: 500 });
  }
} 