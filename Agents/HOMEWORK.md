# Homework — Alixander's To-Do List

**This is your list, not ours.** Everything here is something an agent needs *from you*: a decision, an approval, a piece of information, a file, or a judgment call only the product owner can make.

Agents maintain this file proactively. They add items as they come up and **delete completed items outright** — this board shows live work only. The full history of every answered item lives in git, in `AI_Instructions/`, and in `Agents/REGISTRY.md`.

Last updated: 2026-10-03 (Manager Mike — Plan v3 approved, seed = (ii). Notes 2 and 3 triaged.)

---

## Alixander's Notes
1. We need a way to add producers and assign them to bands. It should be a seperate tab.
2. There is no UI element that lets me add walk-ins, rearrage bands, process drop-outs, etc. I though DeeDee handled this but I don't see anything.
3. I can only input one password. Resets don't do anything.

> **Mike's triage.**
> **1.** Queue item 2. Pete specs it next.
> **2.** Correct — and the confusion is fair. DeeDee *designed* it; nobody *built* it. `07_manual_overrides.md` and `08_ui_specs.md` are written specifications, not working screens. Walk-ins, moves, dissolve, and Needs Attention are queue items 4 and 5. See **M-10** — you may want them sooner.
> **3.** Real bug, and a lockout risk. Tracked as **M-11**; Dan is fixing it alongside Plan v3.

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
| M-10 | HIGH | **Reorder the queue?** Your note 2 says you went looking for walk-in/move/drop-out controls and found nothing. Those are queue items **4 and 5**, behind the Producers and Venue tabs. Want to pull them forward to positions 2 and 3? | You're clearly expecting to use them. If they matter more than the two new tabs, better to reorder now than after Pete specs work you don't need yet. | |
| M-11 | HIGH | **Password reset bug — confirm the fix scope.** Three problems found: (a) `/api/auth/reset` returns *"The recovery answers did not match"* when the real failure is a password under 10 characters — misleading, and the likely cause of "resets don't do anything"; (b) there is **no way to change your password while logged in**, which is why you can "only input one password"; (c) if you can't reproduce your three recovery answers exactly, there is **no recovery path at all**. Fixing (a) and (b) now. For (c), want a documented reset-to-first-run escape hatch? | (c) is a genuine lockout risk on event day. | |

---

## Product Pete — requirements & scope

**Nothing open.** Next up: specs for N-1 Producers and N-2 Venue.

---

## Designer DeeDee — UX & UI

**Nothing open.** Her specs in `AI_Instructions/08_ui_specs.md` are waiting on Dan to build the endpoints.

---

## Developer Dan — implementation

**Nothing open.** Holding on M-8 (Plan v3 approval).

---

## Build queue — order confirmed "go in your order"

| # | Feature | Status |
|---|---|---|
| 1 | **Matching algorithm** | Plan v3 written — awaiting approval (M-8) |
| 2 | **N-1 Producers tab.** Add producers, assign to bands, see each producer's song load. Producer-only people don't count toward band size (`06` §C) and may serve multiple bands — the exception to one-person-one-band. | Needs Pete spec |
| 3 | **N-2 Venue tab.** House/venue gear inventory so venue equipment counts toward band coverage. | Needs Pete spec |
| 4 | Manual overrides — walk-in, move-with-suggestions, dissolve (`07`) | Specced, not built |
| 5 | Needs Attention panel + import preview table (`08`) | Specced, not built |

---

*Completed items are deleted from this board. History lives in git, `AI_Instructions/`, and `Agents/REGISTRY.md`.*
