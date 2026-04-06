# ScheduleSync — Vercel + Neon Setup Guide

A collaborative scheduling tool for legal professionals.  
Built with: Vanilla HTML/CSS/JS + Vercel Serverless Functions + Neon PostgreSQL

---

## Architecture

```
Browser (public/index.html)
    ↓ /api/tasks (GET/POST)
Vercel Serverless Functions (api/*.js)
    ↓ DATABASE_URL
Neon PostgreSQL Database
```

---

## Step-by-Step Deployment

### Step 1 — Create Your Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Click **New Project**
3. Name it `schedulesync`
4. Choose the region closest to you (e.g. `US East`)
5. Click **Create Project**
6. Go to **Connection Details** → copy the **Connection string**
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
7. Keep this — you'll need it in Step 3

---

### Step 2 — Push Code to GitHub

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `schedulesync` (or keep `schedulingassistant`)
3. Make it **Private**
4. Upload all files from this folder:
   - `public/index.html`
   - `api/setup.js`
   - `api/tasks.js`
   - `api/sync-status.js`
   - `package.json`
   - `vercel.json`
   - `.gitignore`
   - `.env.example`

---

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel will auto-detect the project — keep all defaults
4. Before clicking Deploy, click **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Neon connection string from Step 1 |

5. Click **Deploy**
6. Wait ~1 minute — Vercel will give you a URL like `https://schedulesync.vercel.app`

---

### Step 4 — Initialize the Database

1. Visit: `https://your-vercel-url.vercel.app/api/setup`
2. You should see: `{"success":true,"message":"Database tables created successfully..."}`
3. This creates the tables in Neon — only needs to be done once

---

### Step 5 — Add Your Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Your existing project → **APIs & Services → Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized JavaScript Origins**, add your new Vercel URL:
   `https://your-vercel-url.vercel.app`
5. Save
6. Open `public/index.html`, find:
   ```javascript
   const CLIENT_ID = '';
   ```
   Replace with your Client ID, commit and push to GitHub
7. Vercel will auto-redeploy

---

### Step 6 — Share with Your Team

Give everyone this URL: `https://your-vercel-url.vercel.app`

- **Regina** → selects Regina role
- **Kayla/Krista** → selects Kayla/Krista role
- Everyone connects their Google Calendar
- Data syncs automatically via the Neon database

---

## How Sync Works

### Auto-sync (happens automatically)
Every time you make a change (add a task, approve a slot, confirm an appointment), the app:
1. Saves to localStorage immediately (instant local update)
2. Pushes to the Neon database after 2 seconds

### Manual sync
- **↓ Pull Latest** — fetches the newest data from Neon (use when you first open the app)
- **↑ Push Changes** — forces an immediate push to Neon

### Sync bar colors
- 🟢 Green = synced
- 🟡 Yellow = changes pending
- 🔴 Red = sync error

---

## Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local and add your DATABASE_URL

# Run locally
vercel dev
# Opens at http://localhost:3000
```

---

## File Structure

```
schedulesync/
├── public/
│   └── index.html          # Full app UI (all HTML/CSS/JS)
├── api/
│   ├── setup.js            # One-time database setup (run once)
│   ├── tasks.js            # GET/POST all tasks
│   └── sync-status.js      # Last sync timestamp
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

---

## Database Schema

```sql
tasks          -- appointment tasks
slots          -- proposed time slots per task  
slot_approvals -- per-role votes on slots
sync_log       -- audit log of push/pull operations
```

---

## Troubleshooting

**"Server error: 500"**
→ Check your DATABASE_URL is set correctly in Vercel Environment Variables

**"Pull failed"**
→ Make sure you ran /api/setup first to create the tables

**Google Calendar not connecting**
→ Make sure your Vercel URL is added to authorized JavaScript origins in Google Cloud Console

**Changes not appearing for other users**
→ Click ↓ Pull Latest to refresh from the database
