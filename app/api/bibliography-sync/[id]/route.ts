import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';
import { BibliographySyncManager } from '../../../lib/bibliography-sync';

// PUT /api/bibliography-sync/[id] - Update sync configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();
    const config = await BibliographySyncManager.updateSyncConfig(id, user.id, body);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating sync config:', error);
    return NextResponse.json({ error: 'Failed to update sync configuration' }, { status: 500 });
  }
}

// DELETE /api/bibliography-sync/[id] - Delete sync configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    await BibliographySyncManager.deleteSyncConfig(id, user.id);
    return NextResponse.json({ message: 'Sync configuration deleted' });
  } catch (error) {
    console.error('Error deleting sync config:', error);
    return NextResponse.json({ error: 'Failed to delete sync configuration' }, { status: 500 });
  }
} 