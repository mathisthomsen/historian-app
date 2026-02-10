import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface BibliographyItem {
  externalId: string;
  title: string;
  author: string;
  publicationYear?: number;
  type: string;
  description?: string;
  url?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  issn?: string;
  language?: string;
  keywords?: string;
  abstract?: string;
  syncSource?: string;
  syncMetadata?: any;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
  message?: string;
}

export abstract class BibliographyService {
  protected userId: string;
  protected config: any;

  constructor(userId: string, config: any) {
    this.userId = userId;
    this.config = config;
  }

  abstract sync(): Promise<SyncResult>;
  abstract testConnection(): Promise<boolean>;

  protected async upsertLiteratureItem(item: BibliographyItem): Promise<void> {
    await BibliographySyncManager.upsertLiteratureItem(this.userId, item);
  }
}

// Zotero Service Implementation
export class ZoteroService extends BibliographyService {
  private baseUrl = 'https://api.zotero.org';

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Zotero-API-Key': this.config.apiKey,
          'Zotero-API-Version': '3'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Zotero connection test failed:', error);
      return false;
    }
  }

  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: []
    };

    try {
      // Get items from Zotero
      const items = await this.fetchZoteroItems();
      
      for (const item of items) {
        try {
          const bibliographyItem = this.convertZoteroItem(item);
          await this.upsertLiteratureItem(bibliographyItem);
          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import item ${item.key}: ${error}`);
        }
      }

      result.success = true;
      result.message = `Successfully synced ${result.imported} items from Zotero`;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  private async fetchZoteroItems(): Promise<any[]> {
    const url = this.config.collectionId 
      ? `${this.baseUrl}/users/me/collections/${this.config.collectionId}/items/top`
      : `${this.baseUrl}/users/me/items/top`;

    const response = await fetch(url, {
      headers: {
        'Zotero-API-Key': this.config.apiKey,
        'Zotero-API-Version': '3'
      }
    });

    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private convertZoteroItem(item: any): BibliographyItem {
    const creators = item.data.creators || [];
    const authors = creators
      .filter((c: any) => c.creatorType === 'author')
      .map((c: any) => `${c.lastName || ''}, ${c.firstName || ''}`.trim())
      .join('; ');

    return {
      externalId: item.key,
      title: item.data.title || '',
      author: authors || 'Unknown Author',
      publicationYear: item.data.date ? new Date(item.data.date).getFullYear() : undefined,
      type: item.data.itemType || 'unknown',
      description: item.data.abstractNote,
      url: item.data.url,
      publisher: item.data.publisher,
      journal: item.data.publicationTitle,
      volume: item.data.volume,
      issue: item.data.issue,
      pages: item.data.pages,
      doi: item.data.DOI,
      isbn: item.data.ISBN,
      language: item.data.language,
      keywords: item.data.tags?.map((t: any) => t.tag).join(', '),
      syncSource: 'zotero',
      syncMetadata: {
        zoteroItemType: item.data.itemType,
        zoteroKey: item.key,
        zoteroVersion: item.version
      }
    };
  }
}

// Mendeley Service Implementation
export class MendeleyService extends BibliographyService {
  private baseUrl = 'https://api.mendeley.com';

  async testConnection(): Promise<boolean> {
    try {
      // First check if we need to refresh the token
      await this.refreshTokenIfNeeded();
      
      const response = await fetch(`${this.baseUrl}/documents`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Mendeley connection test failed:', error);
      return false;
    }
  }

  async sync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: []
    };

    try {
      // Refresh token if needed before sync
      await this.refreshTokenIfNeeded();
      
      const items = await this.fetchMendeleyDocuments();
      
      for (const item of items) {
        try {
          const bibliographyItem = this.convertMendeleyItem(item);
          await this.upsertLiteratureItem(bibliographyItem);
          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import item ${item.id}: ${error}`);
        }
      }

      result.success = true;
      result.message = `Successfully synced ${result.imported} items from Mendeley`;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.config.refreshToken || !this.config.tokenExpiresAt) {
      throw new Error('No refresh token available for Mendeley');
    }

    // Check if token expires within the next 5 minutes
    const expiresAt = new Date(this.config.tokenExpiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const MENDELEY_CLIENT_ID = process.env.MENDELEY_CLIENT_ID;
    const MENDELEY_CLIENT_SECRET = process.env.MENDELEY_CLIENT_SECRET;

    if (!MENDELEY_CLIENT_ID || !MENDELEY_CLIENT_SECRET) {
      throw new Error('Mendeley OAuth credentials not configured');
    }

    const response = await fetch('https://api.mendeley.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: MENDELEY_CLIENT_ID,
        client_secret: MENDELEY_CLIENT_SECRET,
        refresh_token: this.config.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokenData = await response.json();
    
    // Update the config with new tokens
    this.config.accessToken = tokenData.access_token;
    this.config.refreshToken = tokenData.refresh_token || this.config.refreshToken;
    this.config.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update the database with new tokens
    const { BibliographySyncManager } = await import('./bibliography-sync');
    await BibliographySyncManager.updateSyncConfig(
      this.config.id,
      this.userId,
      {
        accessToken: this.config.accessToken,
        refreshToken: this.config.refreshToken,
        tokenExpiresAt: this.config.tokenExpiresAt
      }
    );
  }

  private async fetchMendeleyDocuments(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/documents`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Mendeley API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private convertMendeleyItem(item: any): BibliographyItem {
    const authors = item.authors
      ?.map((a: any) => `${a.lastName || ''}, ${a.firstName || ''}`.trim())
      .join('; ') || 'Unknown Author';

    return {
      externalId: item.id,
      title: item.title || '',
      author: authors,
      publicationYear: item.year,
      type: item.type || 'unknown',
      description: item.abstract,
      url: item.websites?.[0]?.url,
      publisher: item.publisher,
      journal: item.source,
      volume: item.volume,
      issue: item.issue,
      pages: item.pages,
      doi: item.identifiers?.doi,
      isbn: item.identifiers?.isbn,
      issn: item.identifiers?.issn,
      language: item.language,
      keywords: item.keywords?.join(', '),
      syncSource: 'mendeley',
      syncMetadata: {
        mendeleyId: item.id,
        mendeleyType: item.type,
        mendeleyProfileId: item.profile_id
      }
    };
  }
}

// Generic RIS/BibTeX Import Service
export class GenericImportService extends BibliographyService {
  async testConnection(): Promise<boolean> {
    return true; // No connection needed for file imports
  }

  async sync(): Promise<SyncResult> {
    // This would be implemented for file uploads
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: ['Generic import not implemented yet']
    };
  }

  static parseRIS(content: string): BibliographyItem[] {
    const items: BibliographyItem[] = [];
    const lines = content.split('\n');
    let currentItem: Partial<BibliographyItem> = {};
    let currentTag = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^([A-Z]{2})\s+-\s+(.+)$/);
      if (match) {
        const [, tag, value] = match;
        currentTag = tag;

        switch (tag) {
          case 'TY':
            if (currentItem.title) {
              items.push(currentItem as BibliographyItem);
            }
            currentItem = { type: this.mapRISType(value), syncSource: 'ris' };
            break;
          case 'T1':
          case 'TI':
            currentItem.title = value;
            break;
          case 'AU':
            currentItem.author = currentItem.author ? `${currentItem.author}; ${value}` : value;
            break;
          case 'PY':
            currentItem.publicationYear = parseInt(value);
            break;
          case 'AB':
            currentItem.abstract = value;
            break;
          case 'KW':
            currentItem.keywords = currentItem.keywords ? `${currentItem.keywords}, ${value}` : value;
            break;
          case 'UR':
            currentItem.url = value;
            break;
          case 'DO':
            currentItem.doi = value;
            break;
          case 'PB':
            currentItem.publisher = value;
            break;
          case 'JO':
            currentItem.journal = value;
            break;
          case 'VL':
            currentItem.volume = value;
            break;
          case 'IS':
            currentItem.issue = value;
            break;
          case 'SP':
            currentItem.pages = value;
            break;
          case 'SN':
            if (value.includes('-')) {
              currentItem.issn = value;
            } else {
              currentItem.isbn = value;
            }
            break;
        }
      } else if (currentTag === 'ER') {
        // End of record
        if (currentItem.title) {
          items.push(currentItem as BibliographyItem);
        }
        currentItem = {};
      }
    }

    return items;
  }

  private static mapRISType(risType: string): string {
    const typeMap: { [key: string]: string } = {
      'JOUR': 'journal',
      'BOOK': 'book',
      'CHAP': 'chapter',
      'THES': 'thesis',
      'CONF': 'conference',
      'RPRT': 'report',
      'WEB': 'website'
    };
    return typeMap[risType] || 'unknown';
  }
}

// Main sync orchestrator
export class BibliographySyncManager {
  static async createService(userId: string, serviceType: string, config: any): Promise<BibliographyService> {
    switch (serviceType.toLowerCase()) {
      case 'zotero':
        return new ZoteroService(userId, config);
      case 'mendeley':
        return new MendeleyService(userId, config);
      case 'generic':
        return new GenericImportService(userId, config);
      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }
  }

  static async upsertLiteratureItem(userId: string, item: BibliographyItem): Promise<void> {
    const existingItem = await prisma.literature.findFirst({
      where: {
        userId,
        externalId: item.externalId,
        syncSource: item.syncSource
      }
    });

    const literatureData = {
      userId,
      title: item.title,
      author: item.author,
      publicationYear: item.publicationYear,
      type: item.type,
      description: item.description,
      url: item.url,
      publisher: item.publisher,
      journal: item.journal,
      volume: item.volume,
      issue: item.issue,
      pages: item.pages,
      doi: item.doi,
      isbn: item.isbn,
      issn: item.issn,
      language: item.language,
      keywords: item.keywords,
      abstract: item.abstract,
      externalId: item.externalId,
      syncSource: item.syncSource,
      lastSyncedAt: new Date(),
      syncMetadata: item.syncMetadata
    };

    if (existingItem) {
      await prisma.literature.update({
        where: { id: existingItem.id },
        data: literatureData
      });
    } else {
      await prisma.literature.create({
        data: literatureData
      });
    }
  }

  static async getSyncConfigs(userId: string): Promise<any[]> {
    return await prisma.bibliography_syncs.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createSyncConfig(userId: string, config: any): Promise<any> {
    return await prisma.bibliography_syncs.create({
      data: { ...config, userId }
    });
  }

  static async updateSyncConfig(id: number, userId: string, config: any): Promise<any> {
    return await prisma.bibliography_syncs.update({
      where: { id, userId },
      data: config
    });
  }

  static async deleteSyncConfig(id: number, userId: string): Promise<void> {
    await prisma.bibliography_syncs.delete({
      where: { id, userId }
    });
  }
} 