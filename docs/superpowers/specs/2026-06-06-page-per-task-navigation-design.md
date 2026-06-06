# Page-per-Task Navigation — Design

**Date:** 2026-06-06
**File affected:** `public/index.html` (only)
**Type:** Presentation-layer UI restructure. No backend, API, database, or sync changes.

## Problem

Every scheduling task currently renders as a large card stacked in one long scrolling
column inside `<main>`. With more than a couple of tasks the page becomes cluttered and
hard to scan. The user wants each scheduling choice (task) to have its own focused page.

## Goal

Replace the single stacked list with a two-view, master-detail model:

- A **Home / Overview** page listing all tasks as compact, clickable cards.
- A **Single-task page** showing one task's full detail, reached by clicking its card.

The sidebar, modals, Google Calendar integration, API calls, database, and sync behavior
remain unchanged.

## Navigation model (Option A — approved)

Introduce one module-level state variable:

```js
let currentView = 'home'; // 'home' or a task id (number)
```

- `goHome()` — sets `currentView = 'home'`, re-renders.
- `openTask(id)` — sets `currentView = id`, re-renders. Called when a task card is clicked.
- `renderMain()` — the new top-level render entry point. Inspects `currentView` and renders
  either the overview or the single-task page into `#tasks-container` / `<main>` regions.
- Every existing `renderTasks()` call site is routed through `renderMain()` so that any state
  change (adding a slot, voting, confirming, syncing) re-renders the currently active view
  without further changes to those call sites.

Navigation is in-app state only. The on-screen "← Back to all tasks" link is the way back.
No URL hash routing — the browser Back button will not move between task pages (deliberately
kept simple for an internal tool).

After **Add Task** succeeds, `openTask(newId)` is called so the user lands on the new task's
page immediately.

## Home / Overview view

Rendered when `currentView === 'home'`. Contains the cross-task (global) elements:

1. Page title "Scheduling Tasks" + subtitle.
2. 🗓 Confirmed Appointments panel — moved here unchanged.
3. Toolbar — Check All Availability, Notify, Export Summary, Clear Scheduled (unchanged).
4. 📅 Calendar Availability week view — kept, made **collapsible and collapsed by default**
   to keep the home page clean. A toggle expands it.
5. **Task grid** — responsive grid (2 columns on wide screens, 1 on narrow) of compact cards.
   Each card shows: type icon, title, duration, deadline, status tag, and a slot summary hint
   (e.g. "3 slots · 1 confirmed"). The whole card is clickable and calls `openTask(id)`.
6. A dashed "➕ Add task" card that scrolls to / focuses the sidebar Add Task wizard.
7. Empty state (no tasks) shown here, reusing the existing `#empty-msg` markup.

## Single-task view

Rendered when `currentView` is a task id. Contains only that task:

1. "← Back to all tasks" link → `goHome()`.
2. Task header: title, description, duration / deadline / status tags.
3. The existing full task body, reusing the current `renderTaskCard(task)` output: proposed
   time slots + per-role votes, add-slot row, ✨ Smart Suggest panel, and per-task actions
   (email this task, delete task).

If `currentView` points at a task id that no longer exists (e.g. it was deleted), fall back
to `goHome()`.

## Components / boundaries

- `renderMain()` — router; chooses view. Single source of truth for what `<main>` shows.
- `renderHome()` — builds overview (global panels + task grid). New.
- `renderTaskCardCompact(task)` — small overview card markup. New.
- `renderTaskPage(task)` — single-task detail wrapper (back link + header + existing card body). New.
- `renderTaskCard(task)` — existing detailed card markup, reused inside `renderTaskPage`. Unchanged
  internally (may have its outer wrapper lightly adjusted).
- `goHome()`, `openTask(id)` — navigation. New.

## What does NOT change

- The 4-step Add Task wizard (stays in the sidebar).
- Google Calendar connect / availability-fetch logic.
- All `/api/*` calls, the Neon database, and localStorage/auto-sync behavior.
- Every modal (email, notify, etc.).
- `scheduling-tool.html` (the unused root copy) is left untouched.

## Testing / verification

This is a vanilla HTML/JS app with no test harness. Verify manually in the browser:

1. Load with no tasks → Home shows empty state.
2. Add a task → lands on its task page; "← Back" returns to Home; new card appears in grid.
3. Add a slot / vote / suggest on the task page → view stays on that task and updates.
4. Confirm a slot → appears in Confirmed Appointments on Home.
5. Delete the open task → returns to Home and card is gone.
6. Calendar Availability starts collapsed on Home; toggle expands it.
7. Reload after a sync/pull → tasks repopulate, Home renders correctly.

## Out of scope (YAGNI)

- URL hash routing / browser-Back support.
- Search, filtering, or sorting of the task grid.
- Any change to data shape or the backend.
