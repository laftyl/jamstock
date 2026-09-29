# 07 — Manual Overrides: Walk-ins, Moves, and Band Dissolution

Status: **requirements brief, awaiting owner approval.** Written 2026-09-29 from Alixander's answer to homework P-4 (recorded in `04_open_questions.md` Q10). Nothing here is built.

---

## Problem

On Jan 1, 2027 the admin is standing at a table in In Your Ear Studios with people in front of him. Three things will happen and the app currently handles none of them:

1. Someone shows up who never filled out the form. They have to be registered on the spot and matched.
2. Someone no-shows or walks out after bands are generated, leaving a band below minimum size or without a required role.
3. The admin needs to move one person, or break up a band and spread its members, **without** regenerating everything and losing the bands that already work.

Today the only band-editing operations that exist are generate, clear, and lock (`Agents/CODEBASE_MAP.md` → API surface). There is no way to add a person, no way to move a person, and no concept of an unassigned participant. A single drop-out currently forces a full regeneration.

`06` §G already commits to "Can the administrator manually move people between bands? **Yes**" and `06` §J item 6 lists it as an acceptance test for v1. This document is the specification for that commitment.

---

## Scope

**In scope:** on-the-spot registration, single-person moves with ranked suggestions, band dissolution and redistribution, and the "Unassigned" concept all three depend on.

**Out of scope:** the matching algorithm itself (`03`, `06` §D), band renaming (`02` §6), the performance queue (`06` §I), song submission (`05` §1).

---

## Facts, assumptions, hypotheses

**Fact** — `participants` has no `source` column and no way to represent "registered at the door" (`Agents/CODEBASE_MAP.md` → Data model).
**Fact** — Only `status = 'eligible'` rows are ever committed (`04` Q1). A walk-in who fails eligibility must not be storable as matchable.
**Fact** — Ticket purchase is required to be matchable (`06` §B).
**Fact** — `primary_instrument` is a checkbox field, "check all that apply" (`01` §Section 2), stored as one comma-joined string, and `displayParticipant()` passes it through whole while `public/app.js` labels it `Primary:` (singular).
**Fact** — There is no "unassigned participant" state. A person is either in `band_members` or nowhere.
**Assumption** — Walk-ins are rare (single digits), so a slightly slower manual form is acceptable; moves are frequent and must be fast.
**Assumption** — The admin is the only user and is authenticated; no per-user permissions are needed.
**Hypothesis** — Most event-day moves will be one person at a time, triggered by a drop-out. Whole-band dissolution will happen a handful of times at most. If that's wrong, the redistribution worksheet (Feature C) matters more than I've weighted it.

---

## Feature A — Walk-in registration

Register a participant who never appeared in any import.

### Acceptance criteria

1. An **Add participant** action is available from the participants panel to an authenticated admin, and opens a single-screen form requiring no page navigation and exactly one save action.
2. The form collects every field the matching algorithm consumes, and no others: first name, last name, email, experience level, primary instruments (multi-select), other instruments (multi-select), musical skills (multi-select), genres comfortable (multi-select), genre openness (single choice), availability blocks (7 checkboxes), mentorship role (single choice), equipment access (multi-select), equipment willing to share (multi-select), producer status (none / performer+producer / producer only), producer-open-to-extra-teams (single choice, only when producer status is not "none"), ticket purchased (yes/no), 21 or older (yes/no).
3. Every multi-select option list matches the Google Form option lists in `01` exactly, including an "Other" free-text entry that routes through the same keyword mapping and manual-review path as imported data (`04` Q6, `06` §E).
4. Saving is **refused** with a named reason when ticket purchased is "No" or 21-or-older is "No". A walk-in cannot bypass eligibility (`06` §B, `04` Q1). Verify: attempt both, confirm no row is created.
5. Email is trimmed and lowercased and checked against existing participants before save (`06` §G duplicate policy). On collision the app shows the existing record and offers "update the existing participant" instead of creating a second row. Verify: entering the email of an already-imported participant never produces two rows.
6. A saved walk-in is persisted with a `source` of `manual`, and with `raw_json` populated from the entered values, so every downstream code path — matching, export, display — treats it identically to an imported participant. Verify: a manually added participant appears in the CSV export with the same columns populated as an imported one.
7. A walk-in defaults to checked in, and this is toggleable before and after save. (They are physically present; making the admin click twice is wasted time.)
8. A walk-in added **after** bands are generated is never auto-inserted into an existing band. They appear in the Unassigned list with a ranked placement shortlist produced by Feature B's ranking.
9. Walk-ins are visibly distinguishable from imported participants in the roster (a marker of some kind — DeeDee to spec the treatment), so the admin can audit what was entered by hand.
10. The count of manually added participants is visible on the overview panel alongside the existing import counts.

---

## Feature B — Move an individual between bands

### Acceptance criteria

11. Every participant row inside a band card, and every row in the Unassigned list, exposes a **Move…** action.
12. Choosing **Move…** presents every band as a candidate destination, **sorted ascending by conflict score** — not alphabetically, not by id. "Unassigned" is always available as a destination.
13. The conflict score is computed from the ranked criteria in `06` §D, weighted so that a violation at a higher rank always outranks any number of violations at lower ranks. Verify: a destination that breaks availability (rank 2) always sorts worse than one that only breaks genre (rank 6).
14. Each destination displays, in plain language, the specific constraints the move would **satisfy** and the specific ones it would **violate**, naming the constraint and the resulting value — e.g. "Availability: shared blocks would drop from 6 to 4 of 7", "Percussion: this band currently has none; this member covers it."
15. Destinations that would violate a hard constraint are still listed, marked **Cannot be resolved**, with the reason stated, and require an explicit second confirmation to select. Hard constraints for this purpose: destination band would exceed 6 members; the source band would drop below 3 members; the source band would lose its last percussion, bass, melody, or rhythm carrier; the source band would lose its only producer.
16. The move panel shows the effect on **both** bands — source and destination — before the admin confirms. Verify: move a member and confirm the source band's warnings were shown pre-move, not only after.
17. Confirming is atomic: both bands' memberships update, flags recompute for both bands, and nothing is left half-applied if the operation fails.
18. Every move is written to an override log recording timestamp, participant, source band, destination band, and the conflict score accepted.
19. Any move can be undone from the override log, restoring the prior membership of both affected bands.
20. If neither affected band is locked, the admin is warned that a future regeneration may undo the move, and is offered a one-click lock of both bands (`06` §G: locked bands remain manually editable).
21. Producer assignment is moved separately from band membership. Moving a performer/producer that would put them over their 2-band production cap (`06` §K) raises a warning naming the current load and does not silently exceed it.
22. Moving the last member out of a band leaves an empty band flagged for dissolution rather than deleting it silently.

---

## Feature C — Dissolve a band and redistribute its members

Covers Alixander's exact scenario: someone drops out, the remainder is no longer viable, and the rest of the band has to be spread across other bands.

### Acceptance criteria

23. A band card exposes **Dissolve band** (all members) and a per-member multi-select with **Redistribute selected** (partial dissolve).
24. Dissolve requires a confirmation that names the band and its member count. A locked band must be unlocked first, and the app says so rather than failing silently.
25. On dissolve, all affected members move to Unassigned, and the band record is retained in generation history rather than hard-deleted, so `06` §G's "restore a previous generation" still works.
26. The app then presents a **redistribution worksheet**: one row per displaced member, each with a ranked destination list using the identical ranking as criterion 12/13, so the two features cannot drift apart.
27. The worksheet offers **Place all best-fit**, which assigns each displaced member to their top-ranked non-violating destination and shows a full preview of the result before anything is committed.
28. **Place all best-fit** never exceeds band size 6, never places two displaced members into the same band when a lower-total-conflict split exists, and explicitly reports every member it could not place along with the reason.
29. Placement preference for displaced members follows `02` §5: prefer bands whose missing role this member fills, then bands with the fewest existing duplicates of that member's instrument. Verify with a surplus-bassist scenario — the result must spread bassists across bands rather than stacking them.
30. Partial dissolve leaves the remaining band intact and immediately reports whether the remainder still satisfies minimum size 3, required role coverage, producer coverage, and 5/7 shared availability. If it does not, the band is **flagged, not blocked** (`06` §I).
31. If a remainder falls below 3 members, the app proactively offers to dissolve it too and fold it into the same worksheet.
32. Any placement that would push a receiving band below 5 of 7 shared availability, or would strip its last percussion/bass/melody/rhythm carrier, is surfaced **before** commit, not discovered afterward.
33. A dissolve-plus-redistribute is one undoable transaction: a single undo restores the original composition of every affected band.
34. After commit, the Unassigned list is empty or shows exactly the people who could not be placed, each with a stated reason. Nobody disappears — this is the F4 invariant from `04` (2026-09-29, Pete's answers to P-2).

---

## Cross-cutting dependency — the Unassigned list

35. A participant may exist in a checked-in, eligible state without band membership, and is listed under **Unassigned** with their instruments, availability, experience, and a ranked placement shortlist.
36. The Unassigned count is visible on the overview panel at all times and is non-zero only when the admin has work to do.
37. Regenerating bands considers unassigned participants for placement and never orphans an assigned one without flagging it.

---

## Cross-cutting — show all primary instruments (from P-4)

Alixander asked that each person display *all* primary instruments rather than one. This is a data problem, not only a display problem.

38. Everywhere a participant is rendered — roster row, band card, move panel, redistribution worksheet, export, print, projector view — **all** values of `primary_instrument` are shown, not the first and not a truncated string.
39. The label is plural when the person has more than one primary instrument. The current UI hardcodes the singular `Primary:` and passes the whole comma-joined string through, which reads as one oddly-named instrument.
40. Each instrument renders as a discrete, individually escaped element so that role coverage can be attributed per instrument (e.g. showing which instrument is satisfying the band's bass requirement). **Visual treatment is Designer DeeDee's call.**
41. This depends on the parsing/normalization layer for comma-joined checkbox fields (`Agents/HOMEWORK.md` TD-4, approved). Until that exists, matching cannot reason about second and third primary instruments either — so this is a correctness fix, not a cosmetic one. **Developer Dan.**

---

## Priority and effort

| Feature | Priority | Rough size | What it displaces |
|---|---|---|---|
| B — Move individual with ranked suggestions | **Must** | Medium. The ranking function is shared with the matching algorithm; build it there once. | Nothing. It's already promised in `06` §G and §J.6, and DeeDee's D-2/D-3 answers assume it. |
| Unassigned list (§ cross-cutting) | **Must** | Small, but touches the schema. | Nothing. A, B, and C all require it. |
| Primary-instrument display fix | **Must** | Small on top of TD-4. | Nothing. It rides along with the parsing layer. |
| A — Walk-in registration | **Should** | Medium. Mostly form work, no new matching logic. | Nothing critical, but it is strictly less valuable than B — a walk-in with no way to move them is only half useful. |
| C — Dissolve and redistribute | **Should** | Medium, given B. The worksheet is B applied N times plus a preview. | Could slip past v1 if time runs short, since dissolve can be approximated by repeated single moves. Slower on the day, but not blocking. |

Build order: parsing layer → ranking function → Unassigned → B → A → C.

---

## Risks and assumptions

**Risk** — The conflict-ranking function is the same logic as the matching algorithm. If they are implemented separately they *will* diverge, and the suggestions will start recommending placements the generator would never make. Mitigation: one scoring module, used by both. This is a hard requirement on Dan, not a preference.
**Risk** — Manual moves and regeneration fight each other. Criterion 20 mitigates this with a lock prompt, but if the admin regenerates without locking on event day, he loses his manual work. Worth considering whether regeneration should auto-lock any band containing a manually moved member.
**Risk** — At 1,000 participants (`06` §M), recomputing conflict scores against every band for every destination list is ~250 bands per lookup. Fine, but it must not re-query the database per band (see TD-1).
**Assumption** — Walk-ins are entered by the admin, not self-service on a shared device. Self-service would change the security model entirely, and the app is bound to localhost by design (`06` §A).
**Assumption** — "Dissolve" never needs to delete a band permanently; retaining it in history is acceptable.

---

## Open questions for Alixander

1. When you manually move someone, should the app **auto-lock** both affected bands so a later regeneration cannot undo your work? (Criterion 20 currently just warns.)
2. On a walk-in, do you want to enter the full form (~15 fields, slower but complete matching data) or a short version (name, email, instruments, availability, ticket) with the rest optional? The short version makes them harder to match well.
3. If someone no-shows, do you want to mark them **no-show** — keeping their record and history — or delete them outright? Marking is safer and keeps the invariant checks honest.
