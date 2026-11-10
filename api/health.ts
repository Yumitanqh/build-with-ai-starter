import type { Request, Response } from 'express';

/**
 * Health check endpoint for the Singapore Carpark Tracker API.
 * Supports Vercel/Netlify serverless function signatures as well as Express handlers.
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const hasLtaKey = Boolean(
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'healthy',
    service: 'lta-carpark-tracker-api',
    endpoint: '/api/health',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(typeof process.uptime === 'function' ? process.uptime() : 0),
    ltaDataMall: {
      accountKeyConfigured: hasLtaKey,
      targetEndpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      notes: hasLtaKey
        ? 'Account key detected in environment'
        : 'Set LTA_DATAMALL_ACCOUNT_KEY in environment variables to pull live data',
    },
  });
}
