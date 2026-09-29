# JamStock Codebase Map — Shared Agent Context

Read this before searching. It exists so agents stop re-discovering the same facts.
Last verified: 2026-09-29 (branch `dev`).

## Stack (verified, do not assume otherwise)

| Concern | Reality |
|---|---|
| Runtime | Node.js, CommonJS (`require`, no ESM, no TypeScript, no build step) |
| Server | Express 5 — one file, `server.js` |
| Database | SQLite via `better-sqlite3` (synchronous API), WAL mode, file at `data/jamstock.db` |
| Upload/parse | `multer` (memory storage, 10 MB cap) + `xlsx` for `.csv`/`.xlsx` |
| Frontend | Vanilla JS + hand-written CSS in `public/`. No framework, no bundler, no npm frontend deps |
| Scripts | `npm start` → `node server.js`; `npm run dev` → `node --watch server.js`; `Start.command` for double-click launch |
| Binding | `127.0.0.1:3000` — localhost only, by product decision (`06_build_readiness_form.md` §A) |
| Tests | **None exist.** No test runner, no lint, no CI |
| AI/model integrations | **None in the app.** No API keys, no providers, no `.env` |

## File inventory

| Path | Size | What lives there |
|---|---|---|
| `server.js` | ~63 lines | Entire backend: schema, auth, import, matching, export |
| `public/index.html` | ~68 lines | Whole UI markup (auth view + 4 dashboard panels) |
| `public/app.js` | ~106 lines | Whole frontend controller |
| `public/styles.css` | ~60 lines | Whole design system |
| `AI_Instructions/00–06*.md` | — | **Product source of truth.** Owner-authored requirements |
| `Sample_Data/*.csv` | 4 files | Test fixtures: ideal / few issues / many issues / all entries |
| `data/jamstock.db` | — | Live local data. **Never delete without explicit owner approval** |
| `Agents/` | — | This AI team's config, registry, and shared context |

## Navigation cheat sheet — IMPORTANT

`server.js`, `public/app.js`, and `public/styles.css` are written in a **dense one-statement-per-line style with very long lines**. Reading by line range is nearly useless; a single line can be 2,000+ characters.

**Use `grep_search` with these anchors instead of scrolling:**

### server.js
| Need | Search for |
|---|---|
| All HTTP routes | `app\.(get\|post)\('/api` (regex) |
| DB schema / tables | `CREATE TABLE IF NOT EXISTS` |
| Eligibility rules (who gets excluded) | `function classify(` |
| Band size math (3–6 rule) | `function bandSizes(` |
| Band generation algorithm | `/api/bands/generate` |
| Mentorship scoring | `function mentorshipScore(` |
| Row shaping sent to the UI | `function displayParticipant(` |
| Password hashing / session check | `function hash(`, `function verify(`, `function requireAuth(` |
| Spreadsheet parsing | `function parseRows(` |
| Google Form column lookup | `function value(` |
| CSV export | `/api/bands/export` |

### public/app.js
| Need | Search for |
|---|---|
| Fetch wrapper + auth header | `async function request(` |
| Auth screen state machine | `function showAuth(` |
| Panel/tab switching | `function showDashboard(`, `.tab` |
| Data load + metric counts | `async function loadDashboard(` |
| Participant row rendering | `function renderParticipants(` |
| Band card rendering | `function renderBands(` |
| XSS escaping helper | `function escapeHtml(` |
| Button wiring | `addEventListener(` (all listeners are at the bottom of the file) |

### public/index.html
Panels are `<section>` elements switched by `data-panel`: `overview-panel`, `participants-panel`, `bands-panel`, `imports-panel`. Tabs are `<button class="tab" data-panel="...">`. Every dynamic element has a stable `id` — grep the id, don't read the file top to bottom.

### public/styles.css
Design tokens are on the first `:root` line. Grep the class name (e.g. `.band-card`, `.metric-card`, `.list-row`).

## Data model (SQLite)

```
settings(key PK, value)                 -- password_hash, answer_1..3 (scrypt, salt:digest)
participants(id PK, first_name, last_name, email UNIQUE, experience,
             primary_instrument, other_instruments, skills, genres,
             availability, status, checked_in, raw_json, created_at)
bands(id PK, name, locked, generation, created_at)
band_members(band_id, participant_id) PRIMARY KEY (band_id, participant_id)
```

- `participants.status` ∈ `eligible` | `excluded` | `invalid` | `duplicate` (duplicate is preview-only, never persisted).
- `raw_json` holds the **entire original form row**. Any form field not promoted to a column is still recoverable from here — use `function value(row, ...names)` to read it.
- Only `status = 'eligible'` rows are ever committed to the DB (owner decision, `04_open_questions.md` Q1).

## API surface

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/auth/status` | no | `{ configured }` — first-run detection |
| POST | `/api/auth/setup` | no | Password ≥10 chars + 3 recovery answers |
| POST | `/api/auth/login` | no | Returns opaque bearer token |
| POST | `/api/auth/reset` | no | All 3 recovery answers must match |
| POST | `/api/auth/logout` | token | |
| GET | `/api/dashboard` | ✔ | Counts + `participants[]` + `bandDetails[]` |
| POST | `/api/participants/:id/check-in` | ✔ | Toggles |
| POST | `/api/participants/check-in-all` | ✔ | Eligible only |
| POST | `/api/import/preview` | ✔ | multipart `file`; classifies, flags duplicates, **does not write** |
| POST | `/api/import/commit` | ✔ | Body = preview rows; `INSERT OR IGNORE`, eligible only |
| POST | `/api/bands/generate` | ✔ | Checked-in eligible only; preserves locked bands |
| POST | `/api/bands/clear` | ✔ | Destructive |
| POST | `/api/bands/:id/lock` | ✔ | Toggles lock |
| GET | `/api/bands/export` | ✔ (`?token=`) | CSV download |
| POST | `/api/reset` | ✔ | **Destructive** — wipes participants + bands |

Sessions are an **in-memory `Set`** — every server restart logs the admin out. The frontend stores the token in `localStorage` under `jamstock_session`.

## Code conventions (match these; do not "modernize")

- Full descriptive names: `request` / `response`, never `req` / `res`.
- Named `function` declarations for helpers; `const` arrow functions only for one-liners like `$` and `escape`.
- Dense single-line statements. Multi-line blocks are used only for genuinely long frontend handlers.
- Prepared statements inline (`db.prepare(...).run(...)`); multi-write operations wrapped in `db.transaction(...)`.
- Every user-supplied string rendered into HTML goes through `escapeHtml()`. No exceptions.
- Comments are rare and explain *why*, not *what*. One line max.
- No new dependencies without owner approval.

## Known gaps between shipped code and the owner's requirements

These are **findings, not assignments.** They are the likely backlog.

1. `/api/bands/generate` slices the checked-in list sequentially by `id`. It ignores instrument-role coverage, availability overlap, experience balance, mentor/newbie pairing, equipment sharing, genre, and producer distribution — all of which `03_matching_priorities.md` and `06_build_readiness_form.md` specify.
2. No instrument→role mapping object exists yet (`06` §E defines the intended table; `04` Q6 asks for editable regex keyword mapping).
3. Producers are not modeled at all. `06` §C says producer-only participants must not count toward the 3–6 band size, and `04` Q4 asks for a shared producer pool view.
4. Band renaming is unimplemented; `02` §6 asks for editable band names.
5. `generation` and `locked` columns exist but there is no seed-based repeatable regeneration (`06` §D asks for one).
6. No "needs manual placement" shortlist or per-band warning notes (`06` §D asks for both).
7. Import previews `excluded`/`invalid` counts but the roster only ever shows committed eligible rows, so `issues` on the dashboard is always 0 in practice.
8. `POST /api/auth/logout` deletes the raw `Authorization` header value from `sessions`, which will not match if a client ever sends `Bearer <token>`.
9. `#password-input` is `type="text"`, so the admin password is shown in plaintext on screen.
10. Availability, skills, genres, and instruments are stored as raw comma-joined strings — no parsing or normalization layer exists.
