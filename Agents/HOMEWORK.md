# Homework — Alixander's To-Do List

**This is your list, not ours.** Everything here is something an agent needs *from you*: a decision, an approval, a piece of information, a file, or a judgment call only the product owner can make.

Agents maintain this file proactively. They add items as they come up and **delete completed items outright** — this board shows live work only. The full history of every answered item lives in git, in `AI_Instructions/`, and in `Agents/REGISTRY.md`.

Last updated: 2026-10-04 (Developer Dan — **import fixed.** It was a dependency crash, not our code. Walk-ins / move / Needs Review are unblocked.)

---

## ✅ Import is fixed — please confirm

**It was never a bug in our code.** `src/parse.js`, the import routes, the migration and the client were all innocent. `better-sqlite3@11.10.0` is not compatible with the Node v24 you're running: the native layer aborts the whole server process during garbage collection with `Assertion failed: (env) != nullptr`. It killed the server **mid-request**, which is why the browser just showed a failure with nothing useful in the console, and why the test suite stayed green — the tests are too short-lived to trigger a GC pass.

It was also intermittent: roughly two runs in three crashed, one succeeded. That is the signature of a GC-timing bug, and it's why this looked unreproducible.

**What changed:** `better-sqlite3` 11.10.0 → 12.11.1 · `engines.node >= 22` added to `package.json` · new `test/import.test.js` (24 lines — the small focused one Mike promised, not the 244-line original).

**Verified:** all four files in `Sample_Data/` preview and commit over real HTTP, six consecutive clean runs, 15 tests pass, duplicate emails still skip correctly.

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| D-3 | BLOCKING | **Confirm the import works for you in the browser.** The server is running at http://127.0.0.1:3000 — log in, go to Imports, and load `Sample_Data/ideal_scenario_100_entries.csv`. You should see `101 eligible` and then 101 rows saved. | I verified it over HTTP, not through the real UI with your real database. If it still fails for you, the cause is in the browser layer and I need the console error. | |

**If you ever see the app die again after a Node upgrade, suspect this first.** `better-sqlite3` ships a compiled binary tied to your Node version; upgrading Node without upgrading it reintroduces exactly this crash. Note that `npm` now blocks native install scripts by default — after any reinstall you may need `npm install-scripts approve better-sqlite3`, otherwise the binary is silently never built.

---

---

## Alixander's Notes
1. We need a way to add producers and assign them to bands. It should be a seperate tab.
2. There is no UI element that lets me add walk-ins, rearrage bands, process drop-outs, etc. I though DeeDee handled this but I don't see anything.
3. I can only input one password. Resets don't do anything.
4. I need to be able to name bands when people choose a name. Plus I need a way to store music stems to give to producers matched to those bands

> **Mike's triage.**
> **1.** Queue item 2. Pete has specced it — `AI_Instructions/09_producers.md`.
> **2.** Correct, and the confusion is fair. DeeDee *designed* it; nobody *built* it. `07_manual_overrides.md` and `08_ui_specs.md` are written specifications, not working screens. Now pulled forward into Plan v4.
> **3.** **Fixed and verified.** Change-password endpoint exists; the reset error no longer misreports a short password as wrong recovery answers. Lockout escape hatch still open as M-11.
> **4a.** Band naming — small, already specified in `02` §6, never built. Folding into Plan v4 at little cost. See **M-14**.
> **4b.** Music stems — **not small, and it collides with an existing decision.** See **M-15** before we build anything.

--

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
| M-12 | BLOCKING | **Approve Plan v4** — the three things you just asked for, in one build: **(1) Producers tab** (add producers, assign to bands, show song load); **(2) Walk-in add + manual move/dissolve** from `07`; **(3) Needs Review** — both the band flag panel from Plan v3 and an import review table showing bad rows. Reply `Approve Plan v4`, or name what to cut. | These are queue items 2, 4 and 5 pulled forward. It's a big build, but they're all UI + endpoints on the clean foundation, so doing them together avoids three rounds of the same plumbing. | |
| M-13 | BLOCKING | **"Needs review with a broken data set" has a requirements conflict.** You decided in `04` Q1 that disqualified registrants are *excluded entirely, never imported*, and in `06` §B that excluded registrations are *not stored*. So broken rows are discarded and there is nothing for a review screen to show after import. Pick: **(a)** review happens **before** commit, in the import preview table — you see every bad row and why, then decide (no stored data, no requirement change); or **(b)** also **store** excluded rows so you can revisit them later, which reverses Q1 and `06` §B. | This is why "needs review doesn't work" — it's not only unbuilt, the data is intentionally thrown away. | **(a)** — review before commit. No requirement change; Q1 and `06` §B stand. Import preview table shows every bad row and its reason. |
| M-11 | HIGH | **Password lockout escape hatch.** (a) misleading reset error and (b) no change-password are **fixed and verified**. Still open: if you can't reproduce your three recovery answers exactly, there is no recovery path. Want a documented reset-to-first-run escape hatch? | Genuine lockout risk on event day. | |
| M-14 | HIGH | **Band naming** | Cheap now, annoying to retrofit later. | **"Send it."** Building it. Two sub-questions you didn't answer, so I'm making the call — override either if you disagree: renaming a band **auto-locks** it (same rule as a manual move in P-9, so regeneration can't wipe the name), and the name **appears on the CSV export and projector view**. |
| M-15 | HIGH | **Songs, not stems** | Decides the upload path and storage. | **Answered and accepted.** Producers email you a single mixed track; you upload it manually, one song per band. Local-only (`06` §A) **stands**. This **is** `05` §1 song submission tracking — one feature, a **Songs tab**. Formats mp3/wav/m4a/flac, max **150 MB**, stored on disk in `data/songs/`, gitignored. |
| M-16 | MEDIUM | **Pete's Q13 — do producer assignments survive regeneration?** Today the code recomputes assignments on unlocked bands, so regenerating around a dropout silently reshuffles your producers. My call, which Dan is building: a producer you assigned **by hand** sticks; one the algorithm chose gets recomputed. Confirm or override. | Event-day surprise if wrong. | |

---

## Product Pete — requirements & scope

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| P-14 | HIGH | Confirm whether a producer who is not open to extra teams is limited to one band, with open producers allowed up to the §K cap. | The form asks about extra teams, but §K only states maximum caps; see Q14. | |
| P-15 | HIGH | Resolve whether the >3-song notice is only an integrity warning under hard caps, or whether assignments above 3 may be allowed. | §D's alert cannot occur under §K's 3/2 caps and conflicts with §M's hard constraints; see Q15. | |
| P-17 | HIGH | Choose automatic locking after a manual move, or keep `07`'s warning plus one-click lock for both affected bands. | Without this choice, Dan cannot know whether event-day placements must persist through regeneration; see Q17. | |
| P-18 | MEDIUM | Choose whether no-shows are marked and retained or deleted. | Determines the event-day drop-out action and whether history remains auditable; see Q18. | |

Next: N-2 Venue specification after the producer decisions are recorded.

---

## Designer DeeDee — UX & UI

**Nothing open.** Her specs in `AI_Instructions/08_ui_specs.md` are waiting on Dan to build the endpoints.

---

## Developer Dan — implementation

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|

### Developer Dan — Tech debt

| # | Priority | What I need from you | Why it matters | Your answer |
|---|---|---|---|---|
| D-2 | MEDIUM | Confirm a separate build scope for the print-roster and projector views specified in `AI_Instructions/05_future_features.md`. | No print or projector UI exists; renamed bands already flow to the dashboard and CSV, but there is no display surface to verify downstream names. | |

---

## Build queue — reordered 2026-10-03 to what you actually need

| # | Feature | Status |
|---|---|---|
| 1 | **Matching algorithm** | **Done.** Plan v3 implemented, 15 tests pass, seed input live. |
| 2 | **Producers tab + band naming** | **Done.** Producer-centric assignment with capacity warnings, 5th tab live, rename auto-locks and flows to CSV. 14 tests pass. |
| 3 | **Walk-in add, manual move/dissolve, Needs Review** (band flags + import review table) | Next. Specs: `07`, `08`. |
| 4 | **Songs tab.** Upload one mixed track per band, track which bands have submitted. Merges `05` §1 song submission tracking. | Queued — needs format/size answer in M-15 |
| 5 | **N-2 Venue tab.** House/venue gear inventory so venue equipment counts toward band coverage. | Deferred — needs Pete spec |

---

*Completed items are deleted from this board. History lives in git, `AI_Instructions/`, and `Agents/REGISTRY.md`.*
