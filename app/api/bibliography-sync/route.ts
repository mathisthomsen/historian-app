import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getOrCreateLocalUser } from '../../lib/requireUser';

// Force dynamic rendering to prevent build-time evaluation
export const dynamic = 'force-dynamic';
import { BibliographySyncManager } from '../../lib/bibliography-sync';

// GET /api/bibliography-sync - Get all sync configurations for user
export async function GET(request: NextRequest) {
  const workosUser = await requireUser();
  const user = await getOrCreateLocalUser(workosUser);

  try {
    const configs = await BibliographySyncManager.getSyncConfigs(user.id);
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching sync configs:', error);
    return NextResponse.json({ error: 'Failed to fetch sync configurations' }, { status: 500 });
  }
}

// POST /api/bibliography-sync - Create new sync configuration
export async function POST(request: NextRequest) {
  const workosUser = await requireUser();
  const user = await getOrCreateLocalUser(workosUser);

  try {
    const body = await request.json();
    const { service, name, apiKey, apiSecret, accessToken, refreshToken, collectionId, collectionName, autoSync, syncInterval } = body;

    if (!service || !name) {
      return NextResponse.json({ error: 'Service and name are required' }, { status: 400 });
    }

    const config = await BibliographySyncManager.createSyncConfig(user.id, {
      service,
      name,
      apiKey,
      apiSecret,
      accessToken,
      refreshToken,
      collectionId,
      collectionName,
      autoSync: autoSync || false,
      syncInterval
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error creating sync config:', error);
    return NextResponse.json({ error: 'Failed to create sync configuration' }, { status: 500 });
  }
} 