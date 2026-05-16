/**
 * Seed script — populates the database with sample data
 * Run: node seed.js
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data', 'notes.db'));
db.pragma('foreign_keys = ON');

const USER_ID = 'USR_SEED_DEMO';
const EMAIL = 'john@example.com';

// Check if user exists, reuse or create
let user = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
if (!user) {
  const hash = bcrypt.hashSync('password123', 12);
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)').run(USER_ID, 'John Doe', EMAIL, hash);
  user = { id: USER_ID };
}
const userId = user.id;
console.log('Using user:', userId);

// ── Tags ───────────────────────────────────────────
const tagDefs = [
  { name: 'work',        color: '#6C63FF' },
  { name: 'meeting',     color: '#FF6B6B' },
  { name: 'design',      color: '#4ECDC4' },
  { name: 'frontend',    color: '#FFE66D' },
  { name: 'backend',     color: '#A8E6CF' },
  { name: 'research',    color: '#FF8B94' },
  { name: 'bug',         color: '#e74c3c' },
  { name: 'feature',     color: '#2ecc71' },
  { name: 'urgent',      color: '#e67e22' },
  { name: 'brainstorm',  color: '#9b59b6' },
];

const tagIds = {};
const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name, user_id, color) VALUES (?,?,?,?)');
for (const t of tagDefs) {
  const existing = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(t.name, userId);
  if (existing) {
    tagIds[t.name] = existing.id;
  } else {
    const id = `TAG_${nanoid(8)}`;
    insertTag.run(id, t.name, userId, t.color);
    tagIds[t.name] = id;
  }
}
console.log('Tags seeded:', Object.keys(tagIds).length);

// ── Notes ──────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const sampleNotes = [
  {
    title: 'Sprint Planning – Week 20',
    content: `## Sprint Goals\n\nWe need to finalize the authentication module and begin work on the dashboard.\n\n### Tasks\n- Complete login/signup UI\n- Build JWT middleware\n- Design dashboard wireframes\n- Review API structure with the backend team\n\n### Notes\nThe deadline for the auth module is Friday. We should also prepare UI mockups for the client presentation next Monday.\n\nTODO: Set up CI/CD pipeline for staging deployment.`,
    category: 'work',
    tags: ['work', 'meeting', 'frontend'],
    daysAgo: 0,
    ai: true,
  },
  {
    title: 'React Component Architecture',
    content: `# Component Design Patterns\n\nWe should follow a composable component architecture:\n\n1. **Atomic components** — buttons, inputs, tags\n2. **Molecules** — search bars, card components\n3. **Organisms** — sidebar, editor panel, dashboard grid\n\nEach component should:\n- Accept props for customization\n- Use CSS custom properties for theming\n- Be independently testable\n\nNeed to review the existing codebase and refactor the monolithic App component into smaller pieces.`,
    category: 'ideas',
    tags: ['frontend', 'design', 'research'],
    daysAgo: 1,
    ai: true,
  },
  {
    title: 'API Design Review',
    content: `## REST API Endpoints\n\nReviewed the current API structure. Here are the improvements:\n\n- POST /auth/signup — needs input validation\n- GET /notes — add pagination support\n- PATCH /notes/:id — implement optimistic locking\n- POST /notes/:id/share — add expiry option\n\nWe should also consider adding rate limiting and request logging.\n\nAction items:\n- Update OpenAPI spec\n- Add integration tests\n- Deploy swagger docs\n- Review authentication flow with security team`,
    category: 'work',
    tags: ['backend', 'work', 'meeting'],
    daysAgo: 1,
    ai: true,
  },
  {
    title: 'Bug: Auth Token Expiry',
    content: `## Issue\n\nUsers are being logged out unexpectedly after 30 minutes. The JWT token expiry is set to 7 days but the refresh mechanism isn't working.\n\n### Steps to Reproduce\n1. Login to the app\n2. Leave it idle for 30+ minutes\n3. Try to create a note — 401 error\n\n### Root Cause\nThe frontend isn't sending the token refresh request. The interceptor is missing.\n\n### Fix\nNeed to add an Axios interceptor that catches 401 errors and attempts token refresh before failing.`,
    category: 'work',
    tags: ['bug', 'urgent', 'backend'],
    daysAgo: 2,
    ai: true,
  },
  {
    title: 'Design System Colors',
    content: `# Color Palette\n\nPrimary: #6C63FF (Indigo)\nSecondary: #FF6B6B (Coral)\nSuccess: #4ECDC4 (Teal)\nWarning: #FFE66D (Yellow)\nBackground: #f5f3ff (Lavender)\n\n## Typography\n- Headings: Outfit (700, 800)\n- Body: Inter (400, 500, 600)\n\n## Spacing Scale\n4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px\n\nRemember to update the Figma file with these tokens.`,
    category: 'ideas',
    tags: ['design', 'frontend'],
    daysAgo: 2,
    ai: false,
  },
  {
    title: 'Team Standup Notes – Monday',
    content: `## Monday Standup\n\n**John:** Working on the notes editor. Auto-save is done. Will start AI panel today.\n**Sarah:** Finished the database schema. Starting on tag management API.\n**Mike:** Reviewing the deployment pipeline. Need to fix Docker config.\n\n### Blockers\n- Waiting for design approval on the dashboard layout\n- Need access to the staging server\n\n### Action Items\n- John: Complete AI panel by Wednesday\n- Sarah: Write API tests\n- Mike: Deploy to staging by Thursday`,
    category: 'meeting',
    tags: ['meeting', 'work'],
    daysAgo: 3,
    ai: true,
  },
  {
    title: 'Database Optimization Ideas',
    content: `## Performance Improvements\n\nCurrent queries are slow when the notes table grows. Ideas:\n\n1. Add full-text search index on title and content\n2. Implement connection pooling\n3. Add composite indexes on (user_id, updated_at)\n4. Consider read replicas for analytics queries\n5. Archive old notes to a separate table\n\nWe should benchmark before and after each change.\n\nTODO: Set up pgbench or custom load testing script.`,
    category: 'work',
    tags: ['backend', 'research'],
    daysAgo: 3,
    ai: false,
  },
  {
    title: 'Product Roadmap Q3',
    content: `# Q3 2026 Roadmap\n\n## July\n- Launch collaborative editing\n- Real-time sync via WebSockets\n- Mobile responsive redesign\n\n## August\n- Advanced AI features (auto-categorization)\n- Markdown export/import\n- Team workspaces\n\n## September\n- Analytics dashboard v2\n- Public API for integrations\n- Enterprise SSO support\n\nNeed to discuss priorities with stakeholders. Schedule a roadmap review meeting for next week.`,
    category: 'work',
    tags: ['work', 'brainstorm', 'feature'],
    daysAgo: 4,
    ai: true,
  },
  {
    title: 'Learning: WebSocket Architecture',
    content: `## Real-time Collaboration Research\n\nExplored different approaches for real-time sync:\n\n### Option 1: Socket.IO\n- Easy to set up\n- Good browser support\n- Automatic reconnection\n\n### Option 2: Native WebSockets\n- Lighter weight\n- More control\n- Need to handle reconnection manually\n\n### Option 3: CRDTs (Yjs/Automerge)\n- Conflict-free merging\n- Works offline\n- More complex to implement\n\nRecommendation: Start with Socket.IO for MVP, migrate to CRDTs later.`,
    category: 'ideas',
    tags: ['research', 'feature', 'brainstorm'],
    daysAgo: 4,
    ai: false,
  },
  {
    title: 'Weekly Retrospective',
    content: `## What went well\n- Shipped the auth module on time\n- Great collaboration between frontend and backend\n- Code review process is working smoothly\n\n## What could improve\n- Need better test coverage\n- Deployments are still manual\n- Documentation is lagging behind\n\n## Action items\n- Set up automated testing in CI\n- Create deployment scripts\n- Schedule documentation sprint\n- Follow up on code coverage targets`,
    category: 'meeting',
    tags: ['meeting', 'work'],
    daysAgo: 5,
    ai: true,
  },
  {
    title: 'Personal: Book Recommendations',
    content: `Books to read this quarter:\n\n- **Designing Data-Intensive Applications** by Martin Kleppmann\n- **Clean Architecture** by Robert C. Martin\n- **The Pragmatic Programmer** by Hunt & Thomas\n- **System Design Interview** by Alex Xu\n\nCurrently reading: DDIA, Chapter 5 on Replication.\n\nNotes: The section on leaderless replication is really interesting for our distributed notes system.`,
    category: 'personal',
    tags: ['research'],
    daysAgo: 5,
    ai: false,
  },
  {
    title: 'Feature: Dark Mode Implementation',
    content: `## Dark Mode Plan\n\n### Approach\nUse CSS custom properties with data-theme attribute on root element.\n\n### Steps\n1. Define dark palette variables\n2. Create ThemeContext with toggle\n3. Persist preference in localStorage\n4. Add smooth transition animation\n5. Update all components to use variables\n\nCompleted steps 1-4. Need to audit all hardcoded colors in components.\n\nRemember to test with high contrast mode and screen readers.`,
    category: 'work',
    tags: ['frontend', 'feature', 'design'],
    daysAgo: 6,
    ai: true,
  },
  {
    title: 'Client Feedback – May Demo',
    content: `## Feedback from Client Demo\n\n### Positive\n- Loved the clean UI design\n- AI summary feature was impressive\n- Dark mode got great reactions\n\n### Suggestions\n- Want keyboard shortcuts for power users\n- Need export to PDF functionality\n- Would like note templates\n- Requested better mobile experience\n\n### Priority Changes\n- Move keyboard shortcuts to current sprint\n- Add PDF export to backlog\n- Schedule mobile redesign for Q3`,
    category: 'meeting',
    tags: ['meeting', 'work', 'feature'],
    daysAgo: 6,
    ai: true,
  },
  {
    title: 'Grocery List',
    content: `## This Week\n- Milk\n- Eggs\n- Bread\n- Avocados\n- Chicken breast\n- Brown rice\n- Spinach\n- Tomatoes\n- Olive oil\n- Greek yogurt`,
    category: 'personal',
    tags: [],
    daysAgo: 0,
    ai: false,
  },
  {
    title: 'Meeting: Investor Update Prep',
    content: `## Prep for Investor Meeting\n\nKey metrics to present:\n- MAU: 12,000 (up 40% MoM)\n- Retention: 68% Day-30\n- NPS: 72\n\nNeed to prepare:\n1. Growth slide deck\n2. Product roadmap overview\n3. Financial projections for Q3-Q4\n4. Competitive analysis update\n\nSchedule dry run with team on Wednesday.\nRemember to update the data room with latest financials.`,
    category: 'work',
    tags: ['meeting', 'urgent', 'work'],
    daysAgo: 1,
    ai: true,
  },
];

// Insert notes
const insertNote = db.prepare(`
  INSERT INTO notes (id, user_id, title, content, category, is_archived, is_public, share_id, ai_summary, ai_action_items, ai_suggested_title, ai_generated_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, ?, ?, ?, ?)
`);
const insertNoteTag = db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');
const insertAiUsage = db.prepare('INSERT INTO ai_usage (id, user_id, note_id, action, created_at) VALUES (?, ?, ?, ?, ?)');

// Simple AI analysis functions (matching server logic)
function generateSummary(content) {
  const sentences = content.replace(/\n+/g, '. ').split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
  return sentences.slice(0, 3).join(' ').replace(/\s+/g, ' ').trim().substring(0, 300);
}

function extractActions(content) {
  const items = [];
  const patterns = [/(?:need to|should|must|todo:|TODO:)\s+(.+?)(?:\.|$)/gi, /^[\s]*[-•*]\s+(.+)$/gm, /^\d+[.)]\s+(.+)$/gm];
  for (const p of patterns) {
    let m; p.lastIndex = 0;
    while ((m = p.exec(content)) !== null) {
      const item = (m[1] || '').trim();
      if (item.length > 5 && item.length < 120) items.push(item);
    }
  }
  return [...new Set(items)].slice(0, 6);
}

const insertTransaction = db.transaction(() => {
  for (const n of sampleNotes) {
    const id = `NOTE_${nanoid(10)}`;
    const created = daysAgo(n.daysAgo);
    const updated = daysAgo(Math.max(0, n.daysAgo - Math.floor(Math.random() * 2)));

    let aiSummary = null, aiActions = null, aiTitle = null, aiDate = null;
    if (n.ai) {
      aiSummary = generateSummary(n.content);
      aiActions = JSON.stringify(extractActions(n.content));
      aiTitle = n.title;
      aiDate = updated;
    }

    insertNote.run(id, userId, n.title, n.content, n.category, aiSummary, aiActions, aiTitle, aiDate, created, updated);

    for (const tagName of n.tags) {
      if (tagIds[tagName]) insertNoteTag.run(id, tagIds[tagName]);
    }

    if (n.ai) {
      insertAiUsage.run(`AI_${nanoid(10)}`, userId, id, 'full_analysis', updated);
    }
  }
});

insertTransaction();
console.log(`✅ Seeded ${sampleNotes.length} notes with tags and AI data.`);
db.close();
