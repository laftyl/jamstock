# Homework — Alixander's To-Do List

**This is your list, not ours.** Everything here is something an agent needs *from you*: a decision, an approval, a piece of information, a file, or a judgment call only the product owner can make.

Agents maintain this file proactively. They add items as they come up, delete items that stop being relevant, and move answered items to the Resolved log. You never have to ask them to update it.

Last updated: 2026-09-29

---

## How to use this

- Work top to bottom within each priority. **Blocking** items are stopping work right now.
- Answer directly in the **Your answer** column, or reply in chat and the agent will record it here.
- For approvals, use explicit wording: `Approve Plan v1`, `Approve v1 excluding the schema change`, `Reject v1`, `Revise v1 to ...`. Enthusiasm doesn't count as approval.
- If an item is wrong, stale, or annoying, delete it. This is your document.

**Priority key:** `BLOCKING` (work is stopped) · `HIGH` (needed soon) · `MEDIUM` · `LOW` (whenever)

---

## Manager Mike — coordination & approvals

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| M-1 | HIGH | Pick which of the 10 known gaps in `Agents/CODEBASE_MAP.md` we attack first. My recommendation: the band matching algorithm, since `/api/bands/generate` currently ignores every rule in `03` and `06`. | Nothing else can be sequenced until this is chosen. The event is Jan 1, 2027. | Sounds good |
| M-2 | MEDIUM | Confirm the approval workflow works for you as written — plan versions, explicit approval wording, no edits to app code before approval. Or tell me to loosen it. | If the gate is too heavy you'll route around it, which defeats the point. | Sounds good |
| M-3 | LOW | Decide whether `Agents/` and `.github/agents/` should be committed to git. They're currently untracked on branch `dev`. | Affects whether this team survives a fresh clone. | Yes, let's commit them. |

---

## Product Pete — requirements & scope

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| P-1 | HIGH | `03_matching_priorities.md` §2 (does genre matter for grouping?), §3 (is everyone available the full 48h?), §4 (priority order when rules conflict), and §5 (randomness) are still unanswered. `06` §D partly covers §4 — confirm `06` wins and I'll mark `03` as superseded. | These are live inputs to the matching algorithm. Dan can't implement a priority order that doesn't exist. | 2 - It matters very little in so much that if all other parameters are met, err on the side of grouping via genre. 3 - They may not be, hence why it is important to match with as much availability overlap as possible. 4 - Priority is already mapped out. 5 - Randomness is unneeded.|
| P-2 | HIGH | `06` §D asks me to "give you ideas" for the equipment-sharing fallback and for failsafes when matching fails. Do you want me to draft those, or do you already have an answer? | It's the only requirement in `06` that points back at us instead of at you. | Give me ideas.|
| P-3 | MEDIUM | Roughly how many registrations do you expect? The sample files are 100 rows. | 100 vs 400 changes whether a simple algorithm is good enough or we need something smarter. | The smarter the better. It should be able to do at least 1,000 but 100 is good for now|
| P-4 | MEDIUM | What happens on event day if someone shows up who never registered, or a registered person no-shows after bands are generated? | `06` §D mentions regenerating when a band drops off, but there's no defined walk-in path. | They must register on the spot and we need to be able to manually add them. On that note, their should be an option for me to be able to manually move individuals to other bands if needed, and it makes suggestions based on priority criteria. For example, if people have a band but then someone drops out and I need to spread the remaining band members to other bands, I need a way to do that. Also, as a UI note (please give this to DeeDee) I want each person to show all primary instruments instead of just one.|
| P-5 | MEDIUM | `05_future_features.md` §4 (printable rosters or a projector display?) is blank. | Cheap to build now, annoying to add on Jan 1. | Both |
| P-6 | LOW | Define what "success" means for this tool. Fewer minutes spent matching? No band left without a drummer? Something else? | Gives us a way to argue about features with evidence instead of taste. | All bands are created based on priority criteria. |

---

## Designer DeeDee — UX & UI

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| D-1 | HIGH | `#password-input` is `type="text"`, so your admin password displays in plaintext on a laptop in a room full of people. Approve the one-line fix to `type="password"`. | Genuine shoulder-surfing exposure at a live event. | Yes, please fix this.|
| D-2 | HIGH | When matching produces a band that violates a rule (no percussion, <5/7 availability overlap, no producer), how do you want to see it? Inline warning on the band card, a separate "Needs attention" panel, or both? | `06` §D asks for band-level notes and a manual-placement shortlist. I need to know where they live before I spec it. | Needs attention panel that I can click on each member or band and it gives me a suggestions to resolve with minimal conflicts on the matching criteria.|
| D-3 | MEDIUM | Do you want to drag members between bands, or is a "move to band" dropdown enough? | Drag-and-drop is substantially more work in vanilla JS with no library. | Move to band but it ranks the suggestions based on minimal conflict of matching criteria. It shows what works and what cannot be resolved|
| D-4 | MEDIUM | The import screen shows counts only — you can't see *which* rows were excluded or why, even though the server already returns them. Want a reviewable preview table? | You'll be importing messy real data and won't trust a number with no detail behind it. | Yes show this |
| D-5 | LOW | Will you ever run this on an iPad or phone at the event, or is it laptop-only? | Decides how much the 760px breakpoint actually matters. | Keep it for an iPad |
| D-6 | LOW | Confirm the current visual direction (warm paper, hard yellow shadow, no rounded corners) is what you want, or tell me to change it. | Cheaper to redirect now than after I spec ten new screens against it. | I want it to be beautiful, purple, fucia, neon-esque colors, rounded corners, but not guady. Keep it readable and functional. Like if MacOS was purple|

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

---

## Resolved

Answered or completed items, kept for the record.

| Date | # | Item | Outcome |
|---|---|---|---|
| 2026-09-29 | — | Stand up the four-agent team | Done. Mike, Pete, DeeDee, and Dan are live in `.github/agents/`. |
| 2026-09-29 | — | Rename agents to persona filenames | Done. `Manager_Mike`, `Product_Pete`, `Designer_DeeDee`, `Developer_Dan`. |
| 2026-09-29 | V-2 (partial) | Dan must write clean, readable, testable code and may call out tech debt | Approved by owner, with the condition that every such call is reported so it can be verified. |
