// api/tasks.js
// GET  /api/tasks        - load all tasks with their slots
// POST /api/tasks        - save all tasks (full replace - simple sync strategy)

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS headers so the browser can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET: Load all tasks with slots ──
  if (req.method === 'GET') {
    try {
      const tasks = await sql`
        SELECT * FROM tasks ORDER BY created_at ASC
      `;

      const slots = await sql`
        SELECT * FROM slots ORDER BY task_id, slot_order, created_at ASC
      `;

      // Build the same task object shape the frontend expects
      const taskMap = {};
      for (const t of tasks) {
        taskMap[t.id] = {
          id: Number(t.id),
          title: t.title,
          desc: t.description,
          duration: t.duration,
          dateFrom: t.date_from,
          dateTo: t.date_to,
          prefStart: t.pref_start,
          prefEnd: t.pref_end,
          deadline: t.deadline,
          taskType: t.task_type,
          status: t.status,
          suggestCount: t.suggest_count,
          suggestInterval: t.suggest_interval,
          suggestRules: t.suggest_rules,
          confirmedSlot: t.confirmed_slot,
          slots: []
        };
      }

      for (const s of slots) {
        const tid = Number(s.task_id);
        if (taskMap[tid]) {
          taskMap[tid].slots.push({
            datetime: s.datetime,
            rawText: s.raw_text,
            status: s.availability_status || s.status,
            proposedBy: s.proposed_by,
            busyCalendar: s.busy_calendar,
            confirmed: s.confirmed,
            archived: s.archived,
            reginaApproved: s.regina_approved,
            assistantFlag: s.assistant_flag,
            zoomLink: s.zoom_link,
            approvals: {}
          });
        }
      }

      const result = Object.values(taskMap);

      // Log the sync
      await sql`
        INSERT INTO sync_log (updated_by, action) VALUES ('system', 'pull')
      `;

      return res.status(200).json({ 
        tasks: result,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('GET tasks error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ── POST: Save all tasks (full replace) ──
  if (req.method === 'POST') {
    try {
      const { tasks, updatedBy } = req.body;

      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: 'tasks must be an array' });
      }

      // Delete all existing data and replace (simple sync - last write wins)
      await sql`DELETE FROM slots`;
      await sql`DELETE FROM tasks`;

      for (const task of tasks) {
        // Insert task
        await sql`
          INSERT INTO tasks (
            id, title, description, duration,
            date_from, date_to, pref_start, pref_end,
            deadline, task_type, status,
            suggest_count, suggest_interval, suggest_rules, confirmed_slot,
            updated_at
          ) VALUES (
            ${task.id}, ${task.title}, ${task.desc || null}, ${task.duration || null},
            ${task.dateFrom || null}, ${task.dateTo || null},
            ${task.prefStart || '09:00'}, ${task.prefEnd || '17:00'},
            ${task.deadline || null}, ${task.taskType || 'find'}, ${task.status || 'pending'},
            ${task.suggestCount || '5'}, ${task.suggestInterval || '60'},
            ${task.suggestRules || null}, ${task.confirmedSlot || null},
            NOW()
          )
        `;

        // Insert slots
        for (let i = 0; i < (task.slots || []).length; i++) {
          const s = task.slots[i];
          await sql`
            INSERT INTO slots (
              task_id, datetime, raw_text, status, proposed_by,
              availability_status, busy_calendar,
              confirmed, archived, regina_approved, assistant_flag,
              zoom_link, slot_order
            ) VALUES (
              ${task.id}, ${s.datetime || null}, ${s.rawText || null},
              ${s.status || 'unchecked'}, ${s.proposedBy || 'regina'},
              ${s.status || null}, ${s.busyCalendar || null},
              ${s.confirmed || false}, ${s.archived || false},
              ${s.reginaApproved ?? null}, ${s.assistantFlag || null},
              ${s.zoomLink || null}, ${i}
            )
          `;
        }
      }

      // Log the sync
      await sql`
        INSERT INTO sync_log (updated_by, action) 
        VALUES (${updatedBy || 'unknown'}, 'push')
      `;

      return res.status(200).json({ 
        success: true,
        savedTasks: tasks.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('POST tasks error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
