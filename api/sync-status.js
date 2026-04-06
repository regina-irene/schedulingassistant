// api/sync-status.js
// GET /api/sync-status - returns last updated time and who updated

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const logs = await sql`
      SELECT updated_by, updated_at, action 
      FROM sync_log 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    if (logs.length === 0) {
      return res.status(200).json({ lastUpdated: null, updatedBy: null });
    }

    return res.status(200).json({
      lastUpdated: logs[0].updated_at,
      updatedBy: logs[0].updated_by,
      action: logs[0].action
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
