# Page-per-Task Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single stacked task list in `public/index.html` with a Home overview (compact task grid + shared panels) and a per-task detail page reached by clicking a task card.

**Architecture:** Introduce one `currentView` state variable (`'home'` or a task id). A repurposed `renderTasks()` acts as a router: it toggles the visibility of the shared/global regions and renders either the Home grid or a single task's full card into `#tasks-container`. All existing `renderTasks()` call sites keep working unchanged. Navigation is in-app state with an on-screen "← Back" link (no URL hash routing).

**Tech Stack:** Vanilla HTML/CSS/JS in a single file (`public/index.html`). No build step, no test framework. Verification is manual in the browser.

---

## Verification setup (used by every task)

There is no automated test harness. To verify, serve the `public/` folder and exercise the UI:

```bash
cd C:/Users/regin/projects/schedulingassistant
npx serve public
```

Open the printed URL (e.g. `http://localhost:3000`). The Google Calendar and Neon calls will fail without credentials — that is expected and irrelevant to this layout work. The app still runs from `localStorage`. If a Role modal appears, pick "Regina". Use the sidebar **Add Scheduling Task** wizard to create test tasks.

> Keep the browser DevTools Console open during every verification step and confirm there are **no red JS errors** after each action.

---

## File Structure

Only one file changes:

- Modify: `public/index.html`
  - HTML markup in `<main>` (add ids, a back-link element, a calendar collapse button).
  - CSS in the `<style>` block (new view styles).
  - JS: new state vars, new navigation/render functions, repurposed `renderTasks()`, small edits to `addTask()` and `deleteTask()`.

`scheduling-tool.html` (the unused root copy) is intentionally left untouched.

---

### Task 1: Add CSS for the new views

**Files:**
- Modify: `public/index.html` (insert before `</style>` at line 1367)

- [ ] **Step 1: Add the view styles**

Insert this block immediately **before** the `</style>` tag (line 1367):

```css
  /* ── Page-per-task views ── */
  .back-link {
    display: inline-block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
    margin-bottom: 1rem;
    user-select: none;
  }
  .back-link:hover { text-decoration: underline; }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) { .task-grid { grid-template-columns: 1fr; } }

  .task-card-compact {
    background: var(--card-bg);
    border: 1px solid var(--rule);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .task-card-compact:hover {
    box-shadow: 0 6px 20px var(--shadow);
    transform: translateY(-2px);
    border-color: var(--accent-light);
  }
  .tcc-title { font-weight: 600; font-size: 0.98rem; color: var(--ink); }
  .tcc-desc {
    font-size: 0.8rem; color: var(--muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tcc-meta { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .tcc-foot {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: auto; padding-top: 0.4rem;
  }
  .tcc-hint { font-size: 0.75rem; color: var(--muted); }
  .tcc-arrow { font-size: 1.1rem; color: var(--accent); }
  .task-card-compact.add-card {
    align-items: center; justify-content: center;
    border-style: dashed; color: var(--accent); min-height: 96px;
  }
  .task-card-compact.add-card .tcc-add { font-weight: 600; }
```

- [ ] **Step 2: Verify the page still loads**

Serve and open the app (see "Verification setup"). The page should look unchanged so far (these classes are not used yet). Confirm no console errors.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "Add CSS for page-per-task overview and detail views"
```

---

### Task 2: Add DOM scaffolding (ids, back-link, calendar collapse)

**Files:**
- Modify: `public/index.html` (the `<main>` block, lines ~1582–1644)

- [ ] **Step 1: Add ids and the back-link to the page header**

Replace this block (lines 1582–1585):

```html
    <div>
      <div class="page-title">Scheduling <span>Tasks</span></div>
      <div class="subtitle">Propose time slots, check availability, and manage approvals.</div>
    </div>
```

with:

```html
    <div id="page-header">
      <div class="page-title" id="page-title">Scheduling <span>Tasks</span></div>
      <div class="subtitle" id="page-subtitle">Pick a task to work on, or add a new one.</div>
    </div>

    <div id="back-link" class="back-link" style="display:none" onclick="goHome()">← Back to all tasks</div>
```

- [ ] **Step 2: Give the toolbar an id**

Replace (line 1605):

```html
    <div class="toolbar">
```

with:

```html
    <div class="toolbar" id="main-toolbar">
```

- [ ] **Step 3: Add the calendar collapse button**

Replace (line 1634):

```html
          <button class="cal-fetch-btn" onclick="fetchAndRenderCal()">🔄 Refresh</button>
```

with:

```html
          <button class="cal-fetch-btn" onclick="fetchAndRenderCal()">🔄 Refresh</button>
          <button class="cal-fetch-btn" id="cal-collapse-btn" onclick="toggleCalView()">▸ Show</button>
```

- [ ] **Step 4: Collapse the calendar body by default**

Replace (line 1637):

```html
      <div id="cal-grid-container">
```

with:

```html
      <div id="cal-grid-container" style="display:none">
```

- [ ] **Step 5: Verify**

Reload the app. The "Availability Overview" panel should now show a "▸ Show" button and its grid body should be hidden. Clicking "▸ Show" will not do anything yet (handler comes in Task 3) — that is expected. Confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "Add DOM scaffolding for home/detail views and collapsible calendar"
```

---

### Task 3: Add navigation state and helper functions

**Files:**
- Modify: `public/index.html` (state block ~line 1737; new functions before `function renderTasks()` at line 2986)

- [ ] **Step 1: Add state variables**

After this line (1737):

```js
let tasks = JSON.parse(localStorage.getItem('sched_tasks') || '[]');
```

add:

```js
let currentView = 'home';  // 'home' or a task id (number)
let calCollapsed = true;   // Calendar Availability starts collapsed on Home
```

- [ ] **Step 2: Add the navigation + helper functions**

Immediately **before** `function renderTasks() {` (line 2986), insert:

```js
function openTask(id) {
  currentView = id;
  window.scrollTo(0, 0);
  renderTasks();
}

function goHome() {
  currentView = 'home';
  window.scrollTo(0, 0);
  renderTasks();
}

function focusAddTask() {
  const form = document.querySelector('.add-form');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const titleInput = document.getElementById('new-title-custom');
  if (titleInput) setTimeout(() => titleInput.focus(), 300);
}

function toggleCalView() {
  calCollapsed = !calCollapsed;
  const body = document.getElementById('cal-grid-container');
  const btn = document.getElementById('cal-collapse-btn');
  if (body) body.style.display = calCollapsed ? 'none' : '';
  if (btn) btn.textContent = calCollapsed ? '▸ Show' : '▾ Hide';
}

function apptIcon(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('mediation')) return '⚖️';
  if (t.includes('home visit')) return '🏠';
  if (t.includes('witness')) return '🗣';
  if (t.includes('party')) return '👥';
  if (t.includes('prep')) return '📝';
  return '📋';
}
```

- [ ] **Step 3: Verify**

Reload the app. Clicking "▸ Show" on the Availability Overview should now expand the calendar grid and the button should change to "▾ Hide"; clicking again collapses it. Confirm no console errors. (Task navigation is wired in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "Add page-per-task navigation state and helper functions"
```

---

### Task 4: Convert renderTasks into a router and add view renderers

**Files:**
- Modify: `public/index.html` (replace `renderTasks()` at lines 2986–2998; add three render functions)

- [ ] **Step 1: Replace `renderTasks()` with the router**

Replace this entire function (lines 2986–2998):

```js
function renderTasks() {
  const container = document.getElementById('tasks-container');
  const empty = document.getElementById('empty-msg');
  if (!tasks.length) {
    empty.style.display = '';
    container.innerHTML = '';
    container.appendChild(empty);
    return;
  }
  if (empty) empty.style.display = 'none';

  container.innerHTML = tasks.map(task => renderTaskCard(task)).join('');
}
```

with:

```js
function renderTasks() {
  // If a task page is open but the task no longer exists, fall back to Home.
  if (currentView !== 'home' && !tasks.find(t => t.id === currentView)) {
    currentView = 'home';
  }

  const homeOnly = [
    document.getElementById('confirmed-panel'),
    document.getElementById('main-toolbar'),
    document.getElementById('cal-view-wrap'),
  ];
  const backLink = document.getElementById('back-link');
  const pageHeader = document.getElementById('page-header');

  if (currentView === 'home') {
    homeOnly.forEach(el => { if (el) el.style.display = ''; });
    if (backLink) backLink.style.display = 'none';
    if (pageHeader) pageHeader.style.display = '';
    renderHome();
  } else {
    homeOnly.forEach(el => { if (el) el.style.display = 'none'; });
    if (backLink) backLink.style.display = '';
    if (pageHeader) pageHeader.style.display = 'none';
    renderTaskPage(tasks.find(t => t.id === currentView));
  }
}

function renderHome() {
  const container = document.getElementById('tasks-container');
  if (!tasks.length) {
    // Render the empty-state markup directly. (Do NOT rely on a cached
    // #empty-msg node — innerHTML below removes it from the DOM.)
    container.innerHTML = ''
      + '<div class="empty-state" id="empty-msg">'
      + '<div class="empty-icon">📆</div>'
      + '<h3>No scheduling tasks yet</h3>'
      + '<p>Add tasks in the sidebar, then propose time slots and check against your Google Calendars.</p>'
      + '</div>';
    return;
  }
  const cards = tasks.map(t => renderTaskCardCompact(t)).join('');
  const addCard = '<div class="task-card-compact add-card" onclick="focusAddTask()">'
    + '<div class="tcc-add">➕ Add task</div></div>';
  container.innerHTML = '<div class="task-grid">' + cards + addCard + '</div>';
}

function renderTaskCardCompact(task) {
  const statusTag = task.status === 'scheduled'
    ? '<span class="tag tag-status-scheduled">✓ Scheduled</span>'
    : task.status === 'conflict'
    ? '<span class="tag tag-status-conflict">⚠ Conflict</span>'
    : '<span class="tag tag-status-pending">Pending</span>';
  const total = task.slots.length;
  const confirmed = task.slots.filter(s => s.confirmed && !s.archived).length;
  const slotHint = total
    ? total + ' slot' + (total !== 1 ? 's' : '') + (confirmed ? ' · ' + confirmed + ' confirmed' : '')
    : 'No slots yet';
  return '<div class="task-card-compact" onclick="openTask(' + task.id + ')">'
    + '<div class="tcc-title">' + apptIcon(task.title) + ' ' + esc(task.title) + '</div>'
    + (task.desc ? '<div class="tcc-desc">' + esc(task.desc) + '</div>' : '')
    + '<div class="tcc-meta">'
    + (task.duration ? '<span class="tag tag-duration">⏱ ' + esc(task.duration) + '</span>' : '')
    + (task.deadline ? '<span class="tag tag-deadline">📅 by ' + task.deadline + '</span>' : '')
    + statusTag
    + '</div>'
    + '<div class="tcc-foot"><span class="tcc-hint">' + slotHint + '</span><span class="tcc-arrow">→</span></div>'
    + '</div>';
}

function renderTaskPage(task) {
  if (!task) { goHome(); return; }
  document.getElementById('tasks-container').innerHTML = renderTaskCard(task);
}
```

- [ ] **Step 2: Verify the overview renders**

Reload the app with at least one existing task (add one via the sidebar if needed). The main area should now show a **grid of compact cards** plus a dashed "➕ Add task" card, instead of full stacked cards. The Confirmed Appointments panel, toolbar, and (collapsed) calendar overview remain above the grid. Confirm no console errors.

- [ ] **Step 3: Verify navigation into a task**

Click a compact card. The page should switch to a single task view: the "← Back to all tasks" link appears, the page header / confirmed panel / toolbar / calendar overview are hidden, and the task's full card (slots, ✨ Smart Suggest, actions) is shown. Click "← Back to all tasks" — you return to the grid. Confirm no console errors.

- [ ] **Step 4: Verify the Add-task card**

Click the dashed "➕ Add task" card. The page should scroll to the sidebar wizard and focus the "Custom / Additional Title" input. Confirm no console errors.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "Route renderTasks to home overview and per-task detail views"
```

---

### Task 5: Auto-open new tasks and return Home on delete

**Files:**
- Modify: `public/index.html` (`addTask()` lines ~2867–2978; `deleteTask()` lines ~2980–2984)

- [ ] **Step 1: Auto-open the new task in the "check" branch**

In `addTask()`, in the `if (currentTaskType === 'check')` branch, find (line 2910):

```js
    tasks.push(task);
    saveTasks();
    renderTasks();
    renderConfirmedPanel();
```

and change it to:

```js
    tasks.push(task);
    currentView = task.id;
    saveTasks();
    renderTasks();
    renderConfirmedPanel();
```

- [ ] **Step 2: Auto-open the new task in the "find" branch**

In the `else` (find) branch, find (line 2960):

```js
    tasks.push(task);
    saveTasks();
    renderTasks();
    renderConfirmedPanel();
```

and change it to:

```js
    tasks.push(task);
    currentView = task.id;
    saveTasks();
    renderTasks();
    renderConfirmedPanel();
```

> Note: there are two near-identical blocks — one in each branch. Edit **both**.

- [ ] **Step 3: Return Home when the open task is deleted**

Replace `deleteTask()` (lines 2980–2984):

```js
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}
```

with:

```js
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  if (currentView === id) currentView = 'home';
  saveTasks();
  renderConfirmedPanel();
  renderTasks();
}
```

- [ ] **Step 4: Verify add and delete flows**

Reload the app.
1. Add a new task via the sidebar wizard (either "Find Times" or "Check Times"). After clicking the final add button, you should land directly on the **new task's page** (back link visible, single task shown).
2. Click "← Back to all tasks" and confirm the new card is in the grid.
3. Open a task, click "🗑 Remove". You should be returned to the Home grid and the card should be gone.

Confirm no console errors throughout.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "Open new tasks on creation and return home on delete"
```

---

### Task 6: Full manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run through the full checklist**

Serve the app and verify each item, watching the console for errors:

1. **Empty state:** Clear tasks (in DevTools console: `localStorage.removeItem('sched_tasks'); location.reload()`). Home shows the "No scheduling tasks yet" empty state.
2. **Add → land on task page:** Add a task; you land on its page.
3. **Back navigation:** "← Back to all tasks" returns to the grid; the new card is present with correct title, duration, deadline, status, and slot hint.
4. **In-task updates stay in view:** On a task page, add a slot manually and (if connected) vote/suggest. The view stays on that task and updates — it does not bounce to Home.
5. **Confirm shows on Home:** Confirm a slot (as Regina). Return Home; it appears in 🗓 Confirmed Appointments.
6. **Delete returns Home:** Delete the open task; you return to Home and the card is gone.
7. **Calendar collapse:** On Home, the Availability Overview starts collapsed; "▸ Show" expands it, "▾ Hide" collapses it.
8. **Reload persistence:** Reload the page; tasks repopulate from localStorage and Home renders the grid correctly.

- [ ] **Step 2: Final commit (if any tweaks were needed)**

```bash
git add public/index.html
git commit -m "Polish page-per-task navigation after verification"
```

If no changes were needed in this task, skip the commit.

---

## Notes for the implementer

- `esc()`, `renderTaskCard()`, `renderConfirmedPanel()`, `renderCalView()`, `saveTasks()`, and `toast()` already exist in the file — reuse them; do not redefine.
- All existing call sites of `renderTasks()` (there are ~15) require **no changes** — they now route through the new router automatically.
- Do not touch the API files, `vercel.json`, `package.json`, the database, or `scheduling-tool.html`.
