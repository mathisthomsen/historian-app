// Geocoding service using Nominatim (OpenStreetMap) - FREE API
// Rate limit: 1 request per second

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  country: string | null;
  region: string | null;
  city: string | null;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
  display_name: string;
  importance: number;
}

export class GeocodingService {
  private static instance: GeocodingService;
  private lastRequestTime = 0;
  private cache = new Map<string, any>();
  private failedRequests = new Set<string>();

  private constructor() {}

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  async searchLocations(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Check cache first
    const cacheKey = `search:${query}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HistorianApp/1.0 (https://github.com/your-repo)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Cache the results
        this.cache.set(cacheKey, data);
        this.lastRequestTime = Date.now();
        
        return data;
      }

      return [];
    } catch (error) {
      console.error(`Location search error for "${query}":`, error);
      return [];
    }
  }

  async geocode(locationName: string): Promise<GeocodingResult | null> {
    // Check cache first
    if (this.cache.has(locationName)) {
      return this.cache.get(locationName)!;
    }

    // Don't retry failed requests
    if (this.failedRequests.has(locationName)) {
      return null;
    }

    // Rate limiting: wait at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    try {
      const encodedLocation = encodeURIComponent(locationName);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1&addressdetails=1`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HistorianApp/1.0 (https://github.com/your-repo)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const geocodingResult: GeocodingResult = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          country: result.address?.country || null,
          region: result.address?.state || result.address?.region || null,
          city: result.address?.city || result.address?.town || result.address?.village || null
        };

        // Cache the result
        this.cache.set(locationName, geocodingResult);
        this.lastRequestTime = Date.now();
        
        return geocodingResult;
      }

      // No results found
      this.failedRequests.add(locationName);
      return null;
    } catch (error) {
      console.error(`Geocoding error for "${locationName}":`, error);
      
      // Don't cache network errors, but mark as failed to avoid repeated attempts
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch failed'))) {
        this.failedRequests.add(locationName);
      }
      
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `${latitude},${longitude}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HistorianApp/1.0 (https://github.com/your-repo)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.address) {
        const geocodingResult: GeocodingResult = {
          latitude,
          longitude,
          country: data.address.country || null,
          region: data.address.state || data.address.region || null,
          city: data.address.city || data.address.town || data.address.village || null
        };

        this.cache.set(cacheKey, geocodingResult);
        this.lastRequestTime = Date.now();
        
        return geocodingResult;
      }

      return null;
    } catch (error) {
      console.error(`Reverse geocoding error for ${latitude},${longitude}:`, error);
      return null;
    }
  }

  // Clear cache for testing or memory management
  clearCache(): void {
    this.cache.clear();
    this.failedRequests.clear();
  }

  // Get cache statistics
  getCacheStats(): { cached: number; failed: number } {
    return {
      cached: this.cache.size,
      failed: this.failedRequests.size
    };
  }
}

// Export singleton instance
export const geocodingService = GeocodingService.getInstance(); 