import type { Request, Response } from 'express';

// Target LTA DataMall endpoint as specified:
// Live carpark lots (HDB + LTA + URA): https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
const LTA_DATAMALL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "latitude longitude" e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C: Cars, H: Heavy Vehicles, Y: Motorcycles
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface FormattedCarparkItem {
  id: string;
  development: string;
  area: string;
  agency: 'HDB' | 'LTA' | 'URA';
  lotType: 'car' | 'heavyVehicle' | 'motorcycle';
  rawLotType: 'C' | 'H' | 'Y';
  availableLots: number;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}

/**
 * Serverless handler to query LTA DataMall v2 CarParkAvailabilityv2.
 * Requires header: AccountKey: <your_key> (read from environment variable or request header).
 */
export default async function handler(req: Request, res: Response) {
  // 1. Set CORS and Cache headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported.',
    });
  }

  // 2. Resolve AccountKey from environment variables (or incoming header fallback)
  const headerKey = req.headers['accountkey'] || req.headers['account-key'];
  const accountKey = (
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (typeof headerKey === 'string' ? headerKey : '')
  ).trim();

  if (!accountKey) {
    return res.status(503).json({
      error: 'LTA_DATAMALL_ACCOUNT_KEY_MISSING',
      message:
        'LTA DataMall AccountKey is not configured. Please set the LTA_DATAMALL_ACCOUNT_KEY environment variable, or pass it via the AccountKey header.',
      targetEndpoint: LTA_DATAMALL_URL,
      instruction:
        'Obtain a free LTA DataMall API key at https://datamall.lta.gov.sg/content/datamall/en/request-api.html and add it to your environment variables as LTA_DATAMALL_ACCOUNT_KEY.',
    });
  }

  // 3. Parse query options
  const skip = parseInt((req.query.skip as string) || (req.query['$skip'] as string) || '0', 10);
  const fetchAll = req.query.all === 'true' || req.query.fetchAll === 'true';
  const agencyFilter = (req.query.agency as string)?.toUpperCase();
  const lotTypeFilter = (req.query.lotType as string)?.toUpperCase();
  const rawFormat = req.query.format === 'raw';

  try {
    let allRecords: LtaRawCarparkItem[] = [];

    if (fetchAll) {
      // DataMall returns max 500 per request. Paginate until exhausted (safe limit: up to 6 pages = 3000 records)
      let currentSkip = 0;
      let hasMore = true;
      let iterations = 0;

      while (hasMore && iterations < 6) {
        iterations++;
        const targetUrl = `${LTA_DATAMALL_URL}?$skip=${currentSkip}`;
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            AccountKey: accountKey,
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`LTA DataMall returned HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const batch: LtaRawCarparkItem[] = Array.isArray(data.value) ? data.value : [];
        allRecords.push(...batch);

        if (batch.length < 500) {
          hasMore = false;
        } else {
          currentSkip += 500;
        }
      }
    } else {
      // Single page request
      const targetUrl = skip > 0 ? `${LTA_DATAMALL_URL}?$skip=${skip}` : LTA_DATAMALL_URL;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        return res.status(response.status).json({
          error: 'LTA_DATAMALL_API_ERROR',
          status: response.status,
          statusText: response.statusText,
          details: errorBody || 'Failed to retrieve data from LTA DataMall',
        });
      }

      const data = await response.json();
      allRecords = Array.isArray(data.value) ? data.value : [];
    }

    // 4. Apply optional filters
    if (agencyFilter) {
      allRecords = allRecords.filter((item) => item.Agency?.toUpperCase() === agencyFilter);
    }
    if (lotTypeFilter) {
      allRecords = allRecords.filter((item) => item.LotType?.toUpperCase() === lotTypeFilter);
    }

    // 5. Return in requested format
    if (rawFormat) {
      return res.status(200).json({
        metadata: 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#CarParkAvailabilityv2',
        timestamp: new Date().toISOString(),
        count: allRecords.length,
        skip,
        value: allRecords,
      });
    }

    // Formatted standardized format
    const formattedCarparks: FormattedCarparkItem[] = allRecords.map((item) => {
      let coordinates: { lat: number; lng: number } | null = null;
      if (item.Location && typeof item.Location === 'string') {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates = { lat, lng };
          }
        }
      }

      let lotType: 'car' | 'heavyVehicle' | 'motorcycle' = 'car';
      if (item.LotType === 'H') lotType = 'heavyVehicle';
      if (item.LotType === 'Y') lotType = 'motorcycle';

      return {
        id: item.CarParkID,
        development: item.Development,
        area: item.Area,
        agency: item.Agency,
        lotType,
        rawLotType: item.LotType,
        availableLots: Number(item.AvailableLots) || 0,
        coordinates,
      };
    });

    return res.status(200).json({
      success: true,
      service: 'LTA DataMall CarParkAvailabilityv2',
      timestamp: new Date().toISOString(),
      totalReturned: formattedCarparks.length,
      skip,
      carparks: formattedCarparks,
    });
  } catch (err: any) {
    console.error('Error fetching LTA DataMall carpark availability:', err);
    return res.status(502).json({
      error: 'BAD_GATEWAY',
      message: err.message || 'Failed to connect to LTA DataMall service',
      targetEndpoint: LTA_DATAMALL_URL,
    });
  }
}
