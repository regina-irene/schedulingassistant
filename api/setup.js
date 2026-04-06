// api/setup.js
// Run once to create the database tables
// Visit /api/setup after deploying to initialize the database

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGINT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        duration TEXT,
        date_from TEXT,
        date_to TEXT,
        pref_start TEXT DEFAULT '09:00',
        pref_end TEXT DEFAULT '17:00',
        deadline TEXT,
        task_type TEXT DEFAULT 'find',
        status TEXT DEFAULT 'pending',
        suggest_count TEXT DEFAULT '5',
        suggest_interval TEXT DEFAULT '60',
        suggest_rules TEXT,
        confirmed_slot TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create slots table
    await sql`
      CREATE TABLE IF NOT EXISTS slots (
        id BIGSERIAL PRIMARY KEY,
        task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
        datetime TEXT,
        raw_text TEXT,
        status TEXT DEFAULT 'unchecked',
        proposed_by TEXT DEFAULT 'regina',
        availability_status TEXT,
        busy_calendar TEXT,
        confirmed BOOLEAN DEFAULT FALSE,
        archived BOOLEAN DEFAULT FALSE,
        regina_approved BOOLEAN,
        assistant_flag TEXT,
        zoom_link TEXT,
        slot_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create approvals table (tracks per-slot votes)
    await sql`
      CREATE TABLE IF NOT EXISTS slot_approvals (
        id BIGSERIAL PRIMARY KEY,
        slot_id BIGINT REFERENCES slots(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        vote BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(slot_id, role)
      )
    `;

    // Create sync_log for tracking last update
    await sql`
      CREATE TABLE IF NOT EXISTS sync_log (
        id BIGSERIAL PRIMARY KEY,
        updated_by TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        action TEXT
      )
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database tables created successfully. Your ScheduleSync database is ready!' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: error.message });
  }
}
