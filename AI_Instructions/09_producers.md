# 09 — Producers Tab

Status: **requirements brief.** Q13 and Q16 are resolved below and in `04_open_questions.md`; Q14 and Q15 remain open. UI layout and visual treatment belong to Designer DeeDee. This document defines behavior, not pixels.

## Problem

One admin needs to separate people who signed up to produce from the performer roster, then assign bands to each producer under visible capacity limits. Producers are identified by their registration answers; they are not promoted from the roster in the normal workflow. A band without exactly one producer is already a `BLOCKER`.

## Proposal

Create a separate **Producers** tab that separates producer sign-ups into a distinct group and supports producer-centric band assignment: open a producer, see assigned bands and capacity, then assign or remove bands for that producer. Producer-only assignments stay separate from performer rosters. Walk-in registration remains in `07_manual_overrides.md`; this tab links to that workflow rather than defining another one. Preserve the existing matching and typed-flag model.

**Alixander's Notes #1 (verbatim):** "We need a way to add producers and assign them to bands. It should be a seperate tab."

## Facts, assumptions, hypotheses

**Facts** — The form branches on mixing opt-in, then distinguishes `Performer + Producer` from `Producer only`, and asks whether the person is open to additional teams (`01`). Producer-only participants are a separate shared resource (`04` Q4); they do not count toward band size, while performer-producers do (`06` §C/K). Producer caps are 3 producer-only teams and 2 performer-producer teams (`06` §F/K). One person may perform in one band but produce for multiple bands (M-5; `test/matching.test.js`). Matching already creates producer assignments, reports shortages, enforces the caps, and flags any band with other than one producer as `BLOCKER` (`src/matching.js`, `src/scoring.js`). Saving a generation retains assignments on locked bands and removes/recomputes those on unlocked bands (`src/repositories/bands.js`).

**Resolved decisions** — Hand-assigned producer assignments survive regeneration; algorithm-picked assignments on unlocked bands recompute, while locked-band assignments remain. Until the Songs tab stores actual submissions, assigned-band count is a temporary planned-song count; once Songs lands, show actual song records/count instead (`04`, 2026-10-03).

**Open policy decisions** — Q14 still asks how the additional-teams signup answer affects assignments below the §K role-based maximum. Q15 still asks whether a manual over-cap assignment is allowed to trigger the §D notice or whether over-cap is integrity-warning-only. Do not invent either policy (`04`).

**Hypothesis** — A producer-first view reduces event-day coordination by making each producer's assigned bands, remaining capacity, and band shortages visible together.

## Requirements

### Producer sources and classification

- Identify producers from their signup answers in the Section 5 branch described in `01`: mixing skills and intent, producer role, and willingness to produce for additional teams. Read the original form answers from stored raw data; do not infer from instrument text or names.
- If mixing opt-in is `No`, classify as not a producer and ignore the Section 5 producer branch answers.
- If mixing opt-in is `Yes` and the role is `Performer + Producer`, classify as performer-producer: eligible for the performer roster and producer assignments.
- If mixing opt-in is `Yes` and the role is `Producer only`, classify as producer-only: eligible for producer assignments, never a performer-roster member, and never part of the 3–6 count.
- Use the additional-teams answer to decide whether extra assignments are allowed, subject to the caps in §K; exact capacity mapping awaits Q14.
- If an answer needed to determine producer status, role, or additional-team availability is missing or unrecognized, do not guess. Mark the import row for review with a reason, and do not commit a producer classification or assignment until corrected and re-previewed. This is not a disqualification; eligibility rules remain unchanged.
- The Producers tab separates recognized producer sign-ups into a distinct group; it does not promote people as a standard path.
- Keep a manual exception for an ambiguous form answer or a person identified as a producer on event day. The admin can explicitly set or correct producer role and additional-team willingness, with the override recorded and the source answer preserved. Do not turn this exception into a promotion workflow for ordinary participants.

### Add and assign

- Show the distinct group of producers identified by their signup answers, with role and additional-team answer visible. Ambiguous answers appear for review, not silently classified.
- Start assignment from a producer: opening a producer shows their assigned bands, current load, maximum capacity, and available bands; the admin assigns or removes bands from that producer's view. Do not make band-first assignment the primary workflow.
- Each band has exactly one producer assignment. Producer-only people never count toward the 3–6 performer roster; performer-producers count once as members. A performer may belong to only one band while producing for multiple bands within the applicable cap.
- Maximum capacity comes from `06` §K: 3 bands for producer-only, 2 for performer-producers. Show the maximum and remaining capacity while assigning; warn when one slot remains and at the limit. At the limit, block another ordinary assignment. If loaded or manually overridden data is already over capacity, keep the assignments visible, show an explicit over-cap warning with the maximum and excess count, and offer no normal assignment that increases the excess. Do not silently exceed the cap. The additional-teams answer's effect below this maximum remains Q14.
- The `06` §D notice is triggered only when a producer's assigned-band count is greater than 3: **`[Producer name] is responsible for [count] songs, which is more than 3. Announce: "first come first serve basis."`** Under the §K caps, a valid ordinary assignment cannot trigger it. Until Q15 is answered, show it only when detected in inconsistent/legacy data; do not allow over-cap assignment just to reach the notice. Until Songs lands, assigned-band count is the temporary planned-song count; after that, use actual song submissions/counts in the Songs workflow.
- For walk-ins, send the admin to `07_manual_overrides.md` and its P-9 short form. A walk-in discovered to be a producer may be explicitly marked through the manual exception above.

### Matching, shortage, and band size

- Matching attempts one producer per generated band and distributes available assignments as evenly as possible. Producer availability is informational only, not a matching constraint (`06` §K).
- If capacity is insufficient, still generate the performer bands. Each band without a producer gets the existing producer-assignment `BLOCKER` (`PRODUCER_ASSIGNMENT_INVALID`) with current count 0 and target 1; report the total number of producer-short bands and leave shortage bands explicitly assignable. Do not silently waive the producer requirement.
- Show the admin the shortage count, unassigned producers, and the bands needing producers. They can add a walk-in or manually assign an eligible available producer; reject assignments that exceed the resolved capacity. Do not block band generation solely because producers are short (`06` §K).
- Count only band members whose role is not producer-only toward the 3–6 performer limit. A performer-producer in the band's roster counts once, even if also listed as that band's producer. Producer-only assignments count zero. Recompute the size flag from performer members only.
- On regeneration, locked-band assignments and hand-assigned producers on unlocked bands are retained and count against producer capacity. Algorithm-picked assignments on unlocked bands are recomputed (`04`, Q13).

## Acceptance criteria

1. Importing a `No` mixing answer creates no producer candidate; `Yes` plus each recognized role produces the classification above. A missing or unknown required producer answer is shown for review and creates no producer assignment.
2. An authenticated admin can open **Producers** as a distinct dashboard tab, independent of the participant and band views.
3. A producer-only participant appears in the producer pool, never in performer membership, and does not change a band's 3–6 performer count. A performer-producer appears once as a member and may also appear as a producer.
4. Recognized form sign-ups appear in the separate producer group without a promotion action; ambiguous answers are held for review. An explicit manual exception is available for corrected answers or day-of identification.
5. Starting from a producer, the admin can assign and remove bands. The view shows current assignments, role-based maximum, remaining capacity, and warnings at one remaining slot and at capacity. A normal assignment at capacity is refused.
6. No band can have multiple producer assignments. Performer membership remains unique across bands even when that person produces for multiple bands; producer assignments are counted independently.
7. At generation, a band with no producer has `PRODUCER_ASSIGNMENT_INVALID` at `BLOCKER` severity, and the response reports the number of producer-short bands. Generation still returns its draft when producer capacity is insufficient.
8. Until Songs lands, load shows assigned-band count as planned-song count. After Songs lands, load uses actual song records/counts. Exactly 3 does not trigger the §D notice; a detected count above 3 does, with the exact notice text above. Q15 governs whether a manual over-cap assignment can ever produce this state.
9. A band of 3 performers plus a producer-only producer passes the size check; a band of 2 performers plus a producer-only producer fails it. A performer-producer in the band is counted once.
10. Regeneration retains hand-assigned producers on unlocked bands, recomputes algorithm-picked producers on unlocked bands, and retains assignments on locked bands. Verify each case in a regeneration.
11. Assignment and load changes appear immediately in the producer view, band data, and shortage/flag results; no excluded registrant is written to participant or assignment storage.

## Priority & effort

**Must; medium.** This fulfills Alixander's separate-tab request and `06`'s hard producer-per-band requirement. Q14 and Q15 remain dependencies for the additional-team limit and over-cap notice policy. It displaces no higher-priority event-day work; DeeDee owns the tab's UI specification.

## Risks and assumptions

**Risk** — `06` §D's alert above 3 conflicts with §K's caps of 3 and 2, so valid ordinary assignments cannot trigger it. Do not weaken the caps without Q15.

**Risk** — Algorithm-picked producer assignments on unlocked bands recompute at regeneration; keep their origin distinguishable from hand assignments so the confirmed Q13 persistence rule is applied correctly.

**Risk** — Assigned-band count is only a temporary proxy for songs until the approved Songs tab stores submissions (`05` §1).

**Assumption** — An event-day producer discovered through `07` can be explicitly marked as a producer without changing the standard form-derived classification flow.

## Open questions for Alixander

See Q14–Q15 in `04_open_questions.md`. These are the only producer policy decisions still open.