import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/api-helpers';
import { BibliographySyncManager } from '../../../../lib/bibliography-sync';

// POST /api/bibliography-sync/[id]/sync - Trigger manual sync
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const configs = await BibliographySyncManager.getSyncConfigs(user.id);
    const config = configs.find(c => c.id === id);

    if (!config) {
      return NextResponse.json({ error: 'Sync configuration not found' }, { status: 404 });
    }

    if (!config.isActive) {
      return NextResponse.json({ error: 'Sync configuration is not active' }, { status: 400 });
    }

    const service = await BibliographySyncManager.createService(user.id, config.service, config);
    const result = await service.sync();

    // Update last sync time
    await BibliographySyncManager.updateSyncConfig(id, user.id, {
      lastSyncAt: new Date()
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to sync bibliography',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 