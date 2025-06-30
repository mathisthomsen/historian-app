import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/api-helpers';
import { BibliographySyncManager } from '../../../lib/bibliography-sync';

// PUT /api/bibliography-sync/[id] - Update sync configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
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
  { params }: { params: { id: string } }
) {
  const { user, response } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    await BibliographySyncManager.deleteSyncConfig(id, user.id);
    return NextResponse.json({ message: 'Sync configuration deleted' });
  } catch (error) {
    console.error('Error deleting sync config:', error);
    return NextResponse.json({ error: 'Failed to delete sync configuration' }, { status: 500 });
  }
}

// POST /api/bibliography-sync/[id]/test - Test connection
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

    const service = await BibliographySyncManager.createService(user.id, config.service, config);
    const isConnected = await service.testConnection();

    return NextResponse.json({ 
      success: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test connection' 
    }, { status: 500 });
  }
} 