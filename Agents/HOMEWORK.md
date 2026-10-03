# Homework — Alixander's To-Do List

**This is your list, not ours.** Everything here is something an agent needs *from you*: a decision, an approval, a piece of information, a file, or a judgment call only the product owner can make.

Agents maintain this file proactively. They add items as they come up, delete items that stop being relevant, and move answered items to the Resolved log. You never have to ask them to update it.

Last updated: 2026-10-03 (Manager Mike — M-1 through M-3 resolved; M-4 added, blocking)

---

## Alixander's Notes
1. We need a way to add producers and assign them to bands. It should be a seperate tab.


--

## How to use this

- Work top to bottom within each priority. **Blocking** items are stopping work right now.
- Answer directly in the **Your answer** column, or reply in chat and the agent will record it here.
- For approvals, use explicit wording: `Approve Plan v1`, `Approve v1 excluding the schema change`, `Reject v1`, `Revise v1 to ...`. Enthusiasm doesn't count as approval.
- If an item is wrong, stale, or annoying, delete it. This is your document.

**Priority key:** `BLOCKING` (work is stopped) · `HIGH` (needed soon) · `MEDIUM` · `LOW` (whenever)

---

## Manager Mike — coordination & approvals

M-1 through M-3 are answered and in the Resolved log.

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| M-4 | BLOCKING | **Approve Dan's Plan v1.** It covers V-1, V-3, V-5 and TD-1 through TD-5: add `node --test`, extract matching into pure testable functions, kill the per-participant query, fix bearer-token logout, persist sessions across restart, and add the checkbox parsing layer delivering `primary_instruments: string[]`. Files: `server.js`, `public/app.js`, `package.json`, `.gitignore`, new parsing/matching modules, test files. Reply `Approve Plan v1`, or name what to exclude. | Your "Fix it" answers authorized the *items*; the plan adds a backward-compatible sessions schema change and an API response-shape change, which exceed what a one-line answer covers. Dan is holding until you name the version. |What does this mean? |
| M-5 | HIGH | Dan found a **pre-existing generation bug** while planning: when any band is locked, `/api/bands/generate` keeps the old unlocked bands and appends new ones, so a participant can end up in two bands. He deliberately did not fix it inside the refactor. Want it as its own plan, or folded into the matching-algorithm build? | It can silently corrupt rosters on event day, which is exactly when you'd regenerate around a drop-out. |One person, one band, unless a producer. In that case, see my comment in Alixander Notes |

---

## Product Pete — requirements & scope

P-1 through P-6 are answered and moved to the Resolved log. These are what your answers created.

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| P-7 | HIGH | Approve or reject four items in my P-2 draft (`04_open_questions.md` → *2026-09-29 — Pete's answers to P-2*): **E5** cross-band equipment loans, **E6** an admin-entered house/venue gear inventory, **E7** letting electronic musicians digitally cover a missing bass/keys/percussion role, **F10** a matching time budget (I suggest 10 seconds). | E6 is the biggest single lever — if In Your Ear Studios has a house drum kit, it removes the worst equipment scarcity in the whole event. The rest change what Dan builds. | E6 - love this idea. Create a new tab called "Venue". E7 - Absolutely. F10 - 10 seconds of what? This is not clear. If you're thinking about availability we're talking to the tune of hours not seconds. But Idk what you're talking about. |
| P-8 | HIGH | Approve `AI_Instructions/07_manual_overrides.md` (walk-in registration, move-with-suggestions, dissolve-and-redistribute) as the v1 spec, or tell me what to cut. My recommendation: Move + Unassigned are **must**; walk-in and dissolve are **should**. | `06` §G and §J.6 already promise manual moves. This is the first time they have testable criteria. | Build it all.|
| P-9 | MEDIUM | Three questions from the manual-override spec: (1) Should a manual move **auto-lock** both bands so regeneration can't undo your work? (2) Walk-in form: full ~15 fields, or a short version with the rest optional? (3) When someone no-shows, mark them **no-show** or delete them outright? | (1) decides whether you can lose work on event day. (2) trades typing time against match quality. (3) affects whether the headcount invariants can be trusted. |1. Yes. 2. Short version - experience, instruments, access to instruments, willingness to share, availability. 3. Mark as no-show.|
| P-10 | MEDIUM | Confirm the success definition I derived from your P-6 answer: **100% of bands satisfy every hard constraint with zero BLOCKER flags**, where hard = size 3–6, percussion+bass+melody+rhythm covered, one producer within cap, all members eligible and checked in, nobody in two bands or missing. Availability, veteran presence, vocals, and equipment are reported as percentages rather than pass/fail. It's in `06` §M. | This is the number we'll argue about features with. If it's wrong, everything downstream is measured against the wrong thing. | Correct. |
| P-11 | LOW | `06` §L still lists four defaults awaiting your sign-off: the instrument→role table (§E), equipment behavior (§F), producer shortage behavior (§K), duplicate handling (§G). Say "approve §L as written" or name what to change. | Dan has to hardcode the instrument→role table to build anything. It's the single most load-bearing table in the project. | I made notes in L |

---

## Designer DeeDee — UX & UI

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| D-7 | MEDIUM | Approve widening the existing responsive breakpoint from 760px to 820px for iPad portrait, or keep 760px and accept/verify the five-column roster at 768px. | 768px is just outside the current compact-layout breakpoint, while you expect to use an iPad. See `AI_Instructions/08_ui_specs.md` → Responsive. | Approve |

---

## Developer Dan — implementation

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| V-1 | BLOCKING | Approve adding `node --test` (built into Node, zero new dependencies) for the matching logic. | There are currently no tests at all. Without them I can't safely change the algorithm, and you can't verify that I did what I said. | Go for it. |
| V-2 | HIGH | Confirm: new code is written in a clean multi-line style, and I do **not** reformat the existing dense one-liners unless the reformat is its own approved item. | The existing code is one-statement-per-2000-character-line. Clean new code will look different from the old code. Want you to expect that. | Sounds good. Thanks for the heads up. |
| V-3 | HIGH | Approve a backup step before any schema change — copy `data/jamstock.db` to a timestamped file first. | That DB holds your real work and there's no migration safety net. | Sounds good. |
| V-4 | MEDIUM | `06` §D wants repeatable generation with a saved seed. Should the seed be visible and editable in the UI, or hidden and managed automatically? | Changes the schema and the UI, so I want it decided before I build it. | Please clarify. |
| V-5 | LOW | Do you want `data/jamstock.db` in `.gitignore`? | It contains participant emails. Committing it puts personal data in git history permanently. | Good catch. Take it out. |

### Developer Dan — Tech debt

Debt I've found but am not fixing yet. Each needs your go-ahead before I touch it.

| # | Priority | Issue | Location | Cost of leaving it | Answer |
|---|---|---|---|---|
| TD-1 | HIGH | `/api/bands/generate` runs a `db.prepare(...).get()` **per participant** inside a `.filter()`. Should be one query into a `Set`. | `server.js` → grep `/api/bands/generate` | Gets quadratically worse as registrations grow; also makes the function untestable. | Fix it |
| TD-2 | HIGH | All matching logic lives inline inside the route handler, mixed with `db` calls and `response` shaping. | `server.js` → grep `/api/bands/generate` | Cannot be unit tested at all. This blocks V-1 from being useful. | Fix it |
| TD-3 | MEDIUM | `POST /api/auth/logout` deletes the raw `Authorization` header from `sessions`, which won't match if a client sends `Bearer <token>`. | `server.js` → grep `/api/auth/logout` | Logout silently fails in that case; session stays valid. | Fix it |
| TD-4 | MEDIUM | Instruments, genres, skills, and availability are stored as raw comma-joined strings with no parsing layer. | `participants` table columns | Every matching rule in `03` and `06` needs parsed values. This has to be built before the real algorithm can exist. | Fix it |
| TD-5 | LOW | Sessions live in an in-memory `Set`, so every server restart logs you out. | `server.js` → grep `const sessions` | Minor annoyance now; worse if the server restarts mid-event. | Fix it |
| TD-6 | HIGH | This is becoming spaghetti code and expensive to build. I suggest a refactor. | All | High token usage and risk of not finishing the app on time. | Refactor ASAP |

---

## Resolved

Answered or completed items, kept for the record.

| Date | # | Item | Outcome |
|---|---|---|---|
| 2026-09-29 | — | Stand up the four-agent team | Done. Mike, Pete, DeeDee, and Dan are live in `.github/agents/`. |
| 2026-09-29 | — | Rename agents to persona filenames | Done. `Manager_Mike`, `Product_Pete`, `Designer_DeeDee`, `Developer_Dan`. |
| 2026-09-29 | V-2 (partial) | Dan must write clean, readable, testable code and may call out tech debt | Approved by owner, with the condition that every such call is reported so it can be verified. |
| 2026-09-29 | P-1 | Unanswered sections of `03_matching_priorities.md` | Answered. Genre is a last-resort tie-breaker only; availability is partial by default and must be maximized; randomness is out entirely. Written up as rules in `03` §2, §3, §5. `03` §4 now formally defers to `06` §D as the authoritative ranked priority list. |
| 2026-09-29 | P-2 | Equipment-sharing fallback and matching failsafes | Owner asked for ideas. Drafted an 8-rung equipment fallback ladder (E1–E8) and 11 failsafes (F1–F11) in `04_open_questions.md` under *2026-09-29 — Pete's answers to P-2*. Four items still need a yes/no — tracked as P-7. |
| 2026-09-29 | P-3 | Expected registration volume | Answered: design for 1,000, work with 100 today. Recorded as a hard algorithm-design constraint in `06` §M, with explicit implementation consequences addressed to Dan (no per-participant queries in loops, bitmask availability, parse once). |
| 2026-09-29 | P-4 | Walk-ins and drop-outs on event day | Answered: on-the-spot registration, manual add, manual move with ranked suggestions, and redistribution after a drop-out. Full spec with 41 numbered acceptance criteria written to `AI_Instructions/07_manual_overrides.md`. Approval tracked as P-8. |
| 2026-09-29 | P-5 | Printable rosters or projector display | Answered: both. Recorded in `05_future_features.md` §4, including that the projector view omits emails and equipment details per `06` §F. |
| 2026-09-29 | P-6 | Definition of success | Answered: "all bands are created based on priority criteria." Translated into a measurable target in `06` §M — 100% of bands satisfying every hard constraint with zero BLOCKER flags. Confirmation tracked as P-10. |
| 2026-10-03 | D-1 | Mask the admin password | Implemented: `#password-input` now uses `type="password"`. |
| 2026-10-03 | D-2 | Needs attention placement and interactions | Specified the fifth tab, severity queue, entity drill-in, ranked remedies, and flag contract in `AI_Instructions/08_ui_specs.md`; implementation belongs to Dan. |
| 2026-10-03 | D-3 | Ranked manual moves and unresolved conflicts | Specified lexicographic ranking, both-band impact preview, blocker confirmation, atomic move endpoint, and response contract in `AI_Instructions/08_ui_specs.md`; implementation belongs to Dan. |
| 2026-10-03 | D-4 | Reviewable import rows and reasons | Specified the review table, 1,000-row paging behavior, row reasons, and preview/commit contract in `AI_Instructions/08_ui_specs.md`; implementation belongs to Dan. |
| 2026-10-03 | D-5 | iPad use | Recorded 768px portrait and 1024px landscape behavior and the 760px breakpoint risk in `AI_Instructions/08_ui_specs.md`; visual verification remains pending, and the breakpoint decision is tracked as D-7. |
| 2026-10-03 | D-6 | Purple, rounded visual direction | Implemented the approved light purple/fuchsia token reskin, checked text contrast, rounded surfaces/controls, and visible keyboard focus in `public/styles.css`; DOM and class names are unchanged. |
| 2026-10-03 | 07 §7 | Display all primary instruments | Specified array-shaped `primary_instruments` data and fully visible wrapping chips for roster/band cards in `AI_Instructions/08_ui_specs.md`; parsing/API implementation belongs to Dan (TD-4). |
| 2026-10-03 | M-1 | Which gap to attack first | Answered "sounds good" to the matching algorithm. Sequencing set: TD-2 extraction and TD-4 parsing come first because the real algorithm needs both, and it needs the instrument→role table from P-11. |
| 2026-10-03 | M-2 | Is the approval gate workable | Confirmed as written. Plan versions and explicit approval wording stay in force. Dan held at the gate on his first plan, which is the intended behavior. |
| 2026-10-03 | M-3 | Commit the agent files | Done by Alixander. `.github/agents/*.agent.md`, `Agents/*.md`, and `AI_Instructions/00`–`07` are all tracked in git. |
| 2026-10-03 | D-6 (verification) | Visual check of the reskin | Verified in the running app by Mike, not DeeDee. Auth view rendered at `http://127.0.0.1:3000`: purple/fuchsia palette, rounded corners, lavender offset shadow, password masked. Dashboard still unverified — it is behind the password. |
