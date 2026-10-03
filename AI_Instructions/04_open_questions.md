# 04 — Open Questions Log

Use this file as a running log for smaller decisions I ask you about mid-build. I'll add dated questions here as they come up; answer underneath each one.

---

### 2026-09-14 — Questions from reading 01/02/03

**Q1. Disqualified registrants (Section 8 routing)**
The form auto-routes people to "Section 8: not a good fit" if they answer: under 21, no reliable transportation, "cannot commit" to the full 48 hours, or the joke "wrong answer" on the mentorship question. Should the importer:
(a) exclude these people entirely from the participant pool (they never show as checkinable), or
(b) still import them but flag/hide them by default in case you want to manually override?

Answer: a

**Q2. Mentor/newbie hard rule strictness**
02 and 03 say "spread of skill levels" and "veteran musicians with newbies" is a "Necessary" priority. Does every band strictly require at least one mentor (advanced/intermediate "I have experience to share") paired with at least one newbie ("I am new")? Or is this best-effort when the pool allows it (e.g. an event with mostly beginners can't guarantee a mentor per band)?

Answer: Preferred: Build teams with a mix of experience levels, ideally including at least one veteran Advanced per group.

Fallback: If an ideal mix is not possible, divide participants into two experience groups:
Newer: None + Beginner
Experienced: Intermediate + Advanced

Prioritize forming teams that combine members from both groups to create balanced teams.

**Q3. "Complimentary equipment... Tied with" (03 #5)**
Your note cuts off: "Complimentary equipment of those willing to share. Tied with" — tied with what other priority? Please finish this thought.

Answer: I fixed this. Tied with 4.

**Q4. Producers/mixing engineers — in-band or separate pool?**
Section 5 shows producers can choose "Performer + Producer" (in a band, also mixes) or "Producer only," and some are open to producing for multiple teams. Should producers who are "Producer only" and "open to additional teams" be tracked as a separate shared resource pool rather than counted toward a single band's roster/size limit (3–6)?

Answer: Yes. We need a way to split them up and see.

**Q5. Genre priority tiers (03 #6, "Nice to have" 5 & 6)**
You listed "genre matching for folks who want to stick to their genre" and "genre matching for folks okay with going outside their genre" as two separate nice-to-haves. Should this map directly to the "Are you open to playing genres outside your normal style?" answer (Absolutely / Potentially / prefer to stay), with "prefer to stay" people getting stricter genre matching and "Absolutely" people being genre-flexible fill-ins?

Answer: Yes

**Q6. "Other" instrument free-text categorization**
For "Other" instrument/skill/equipment answers, do you want me to maintain a small keyword-mapping list (e.g. "ukulele" → strings/melodic) that you can edit, or should unmatched "Other" entries just get flagged for manual review instead of guessed automatically?

Answer: I want keyword mapping. Regex. Whatever is best suited to this. I am happy to build this with you with your guidance.

**Q7. Availability overlap threshold (03 #6 "at least 70% overlapping time")**
The form's availability options are 7 discrete blocks (Fri evening, Sat morning/afternoon/evening, Sun morning/afternoon/evening). With only 7 blocks, 70% overlap ≈ 5 of 7 shared blocks. Should this be calculated per band as "all members share at least 5 of 7 blocks in common," or pairwise between each member?

Answer: All members share at least 5 of 7 blocks. If that is not feasible, make it to where pairs of members share 5 of 7 blocks so that they can write parts in smaller groups and collab asyncronously.

---

### 2026-09-29 — Owner answers to homework P-1 through P-6

Recorded from `Agents/HOMEWORK.md`. These are decisions, not proposals.

**Q8. `03` §2 genre, §3 availability, §4 priority order, §5 randomness** (homework P-1)

Answer: "2 — It matters very little in so much that if all other parameters are met, err on the side of grouping via genre. 3 — They may not be, hence why it is important to match with as much availability overlap as possible. 4 — Priority is already mapped out. 5 — Randomness is unneeded."

Recorded as implementable rules in `03_matching_priorities.md` §2, §3, §5. §4 now formally defers to `06` §D as the authoritative ranked list.

**Q9. Expected registration volume** (homework P-3)

Answer: "The smarter the better. It should be able to do at least 1,000 but 100 is good for now."

Recorded as a hard algorithm-design constraint in `06_build_readiness_form.md` §M. This rules out any approach that is quadratic per participant.

**Q10. Walk-ins and drop-outs on event day** (homework P-4)

Answer: "They must register on the spot and we need to be able to manually add them. On that note, there should be an option for me to be able to manually move individuals to other bands if needed, and it makes suggestions based on priority criteria. For example, if people have a band but then someone drops out and I need to spread the remaining band members to other bands, I need a way to do that. Also, as a UI note (please give this to DeeDee) I want each person to show all primary instruments instead of just one."

Requirements written up in `AI_Instructions/07_manual_overrides.md`. The all-primary-instruments note is a data problem as well as a display problem — see `07` §7.

**Q11. Printable rosters vs projector display** (homework P-5)

Answer: "Both." Recorded in `05_future_features.md` §4. Consistent with `06` §I, which already answers yes to both.

**Q12. Definition of success** (homework P-6)

Answer: "All bands are created based on priority criteria." Translated into a measurable target in `06_build_readiness_form.md` §M.

---

### 2026-09-29 — Pete's answers to P-2

Alixander asked for ideas on (a) the equipment-sharing fallback and (b) failsafes when matching fails a hard constraint (`06` §D). **These are proposals, not decisions.** They are ranked so they can be cut from the bottom. Approve, edit, or reject per item.

#### (a) Equipment-sharing fallback ladder

Applied in order. Stop at the first rung that closes the gap. Every rung records *how* the gap was closed so the band card can show it.

| Rung | Rule | Notes |
|---|---|---|
| E1 | **Self-supplied.** The member assigned to the role lists that item under "portable instruments/equipment you have access to." | No sharing needed. Preferred outcome. |
| E2 | **In-band share.** Another member of the same band listed the needed item under "equipment willing to share." | This is what `06` §F means by "shared equipment can satisfy a band requirement." |
| E3 | **Re-role inside the band.** Before moving any person, reassign an existing member to a non-primary instrument role the band already has equipment for (e.g. keys covers bass). | Uses the fallback-role model already in `03` §6 / `06` §E. Cheapest real fix. |
| E4 | **Equal swap with another band.** Swap this member with a same-role member of another band who brings the missing item, only if the swap does not break the other band's coverage. Rank candidate swaps by net conflict change across both bands. | Never accept a swap with a positive net conflict score. |
| E5 | **Cross-band loan.** The item exists in the pool but belongs to another band's member who is willing to share. Flag as `Shared item — scheduling required`, naming the owner, their band, and their availability blocks so you can broker it. | Adds real-world logistics burden. Cap at one outbound loan per owner. **Needs your approval.** |
| E6 | **House gear.** An admin-editable inventory of equipment the venue/organizers provide (e.g. house drum kit, amps, mics at In Your Ear Studios) that satisfies a gap for any band. | New data you'd have to enter once. Probably the single highest-value fix, because a house kit removes the worst scarcity (percussion). **Needs your approval.** |
| E7 | **Digital substitution.** If a band member has "Electronic music equipment (MIDI, laptop, synths, VSTs)," allow them to cover a missing bass, keys, or percussion role electronically. | Should be allowed by default in my opinion; say if you disagree. |
| E8 | **Unresolved.** Band is flagged `Equipment gap: <role/item>` with a named shortlist of people who own or share that item. Draft generation is **not** blocked (`06` §F). Finalizing the band requires you to explicitly acknowledge the gap, and the acknowledgement is logged and exported. | |

Hard rules that apply at every rung:
1. **Consent is never inferred.** Only items explicitly checked under "equipment willing to share" count as a source. Anyone who selected "I have no equipment / I do not feel comfortable sharing" is never counted as a source and never appears in a suggestion list.
2. **Access ≠ willingness.** "Has access to" satisfies that person's own role. It does *not* satisfy a bandmate's role unless the same item also appears under "willing to share."
3. **Scarcity first.** Tally share-willing units of each item across the checked-in pool. Allocate scarce items (percussion, amps, bass rigs) before common ones, mirroring the instrument-tally model in `03` §6.
4. **"I do not have access to a portable version of my instrument"** is a first-class signal: that person is assumed to bring nothing and must be covered by E2, E6, or E7.
5. Equipment is rank 5 in `06` §D — it may never displace eligibility, producer coverage, mentorship, availability, or experience balance.

#### (b) Failsafes beyond the ones you already specified

You already have: flag the band, per-producer song counts with a "first come first serve" notice above 3, and a manual-placement shortlist (`06` §D). These are additions, ranked by how much admin pain they remove on Jan 1.

| # | Failsafe | Why it earns its place |
|---|---|---|
| F1 | **Pre-flight feasibility report, before generating.** Given the checked-in pool, state up front what cannot possibly work: "118 checked in → ~26 bands. You have 14 percussion-capable people. At least 12 bands will be flagged for percussion." | Tells you the truth *before* you look at 26 broken band cards. Highest value item on this list. |
| F2 | **Typed flags with reason codes and severity.** `BLOCKER` (fewer than 3 members, no producer, missing percussion/bass/melody/rhythm) · `WARNING` (shared availability under 5/7, no veteran, equipment gap, no vocals) · `INFO` (genre mismatch, producer at capacity). Every flag carries a band id, a plain-language reason, and named remedy candidates. | Makes DeeDee's "Needs attention" panel (D-2) sortable instead of a wall of text. |
| F3 | **Explicit relaxation ladder, logged.** When a band can't satisfy everything, relax constraints strictly bottom-up by `06` §D rank: genre → equipment → role coverage (fall back to secondary roles) → experience balance → availability. Record on the band exactly which constraint was relaxed and why. Eligibility and "every band has a producer" are never silently relaxed. | Turns "the algorithm did something weird" into "the algorithm gave up genre to protect availability, here's the line item." |
| F4 | **Zero-person-left-behind invariant.** Before committing a generation, assert `band members + producer-only assignments + explicitly parked = checked-in eligible count`. If it doesn't balance, refuse to commit and name the missing people. | Catches the worst class of bug — someone quietly vanishing — automatically, every time. |
| F5 | **No-duplicate-membership invariant.** No participant appears in two bands. Producing for a second band is a producer assignment, not a membership, and is capped (2 for performer/producers, 5 for producer-only, per `06` §K). | Same rationale as F4. |
| F6 | **Minimum-size tail rule.** Never emit a band of fewer than 3. If the remainder can't form a valid band, distribute those people into existing bands up to size 6, preferring bands whose coverage gap they fill, then bands with the fewest duplicates of their instrument. | Directly implements `02` §5 ("5 bands with 2 bassists, not 2 bands with 5"). |
| F7 | **Generation preview and diff.** Generation produces a preview with flag counts by type and a diff against the previous generation ("3 bands changed, 7 people moved") before you commit. | Lets you regenerate after a drop-out without fear of silently reshuffling the room. |
| F8 | **One-click restore of any prior generation,** each saved with its seed and timestamp. | `06` §G already asks for saved generations; this makes them a safety net rather than an archive. |
| F9 | **Finalize gate.** "Finalize bands" is blocked while any `BLOCKER` flag is unacknowledged. You can always acknowledge and proceed, but the acknowledgement is recorded and exported. | `06` §I says warnings inform rather than block — this keeps that true while making sure nothing is missed by accident. |
| F10 | **Time cap with honest reporting.** Matching must return a result within a fixed budget even at 1,000 participants. If the budget is hit, return the best solution found and say so explicitly rather than hanging. | Ties to the 1,000-participant target in `06` §M. **Needs your approval on the budget — I'd suggest 10 seconds.** |
| F11 | **Unmatched-person parking lot.** An explicit "Unassigned" list for anyone the generator could not place, each with a ranked destination shortlist and a stated reason they couldn't be placed automatically. | Required anyway by the walk-in and drop-out flows in `07_manual_overrides.md`. |

Items needing an explicit yes/no from you: **E5**, **E6**, **E7**, **F10** (and the time budget).

---

### 2026-10-03 — Producers tab (N-1)

**Owner decision P-9 — short walk-in form**

The walk-in form is the short version: experience, instruments, instrument access, willingness to share, and availability. The existing eligibility requirements still apply. Walk-in form and registration behavior are specified in `07_manual_overrides.md`; `09_producers.md` only points to that flow and covers the producer-specific exception when a day-of participant is identified as a producer.

**Q13. Producer assignments on regeneration**
Should explicit producer assignments on unlocked bands be retained across regeneration, or recomputed with the new generation? Current code preserves assignments on locked bands and recomputes unlocked ones. Recommendation: keep that rule, with the admin locking bands whose producer assignments must persist.

**Q14. Additional-team answer and capacity**
Does answering "No, I'd rather focus on my team" limit the producer to one band, while "Absolutely!" allows the §K maximum (3 producer-only, 2 performer-producer)? Recommendation: yes; this gives the form answer an implementable effect without exceeding approved caps.

**Q15. More-than-three alert versus capacity caps**
Should the §D "more than 3 songs" notification be an integrity warning only (normal assignments remain capped at 3/2), or may the admin assign a producer to more than 3 bands and trigger the warning? These conflict with §M's hard requirement that every band have a producer within that producer's cap. Recommendation: preserve the hard caps and keep the alert for detected over-cap data only.

**Q16. Song-load unit**
Until song records exist, may the tab count each assigned band as one planned song? `05` treats song submission as a stretch feature; the event registration describes one song per band. Recommendation: use assigned-band count as the temporary load, then use actual producer-linked song records when that feature exists.

### 2026-10-03 — Confirmed follow-up decisions

**Q13. Producer assignments on regeneration — answered**
Hand-assigned producer assignments survive regeneration, including on unlocked bands. Algorithm-picked producer assignments on unlocked bands recompute; assignments on locked bands remain. The producer workflow and generation must distinguish hand assignments from algorithm picks.

**Q16. Song-load unit — answered**
Assigned-band count may serve as the temporary planned-song count only until the Songs tab lands. Once it does, use actual uploaded song records/counts; the owner expects one mixed track per band.

**Songs tab — approved and queued**
Producers email the admin one mixed track per band; the admin uploads manually. Support mp3/wav/m4a/flac up to 150 MB, stored locally in `data/songs/`. This merges with `05` §1; it is one Songs feature, not a separate stems workflow.

**Band renaming — downstream output confirmed**
A chosen band name must update CSV export, print rosters, and projector view, not only the editable band record. The naming rule is recorded in `02` §6.

Q14 and Q15 remain unanswered; do not re-ask Q13 or Q16.

**Q17. Auto-lock bands after a manual move**
Should moving a participant automatically lock both affected bands against regeneration, or keep the current `07` proposal: warn the admin and offer a one-click lock? This decides whether a confirmed event-day placement can be silently recomputed.

**Q18. No-show record handling**
When someone does not arrive, should the admin mark them as a no-show and retain their record/history, or delete them? `07` recommends retaining the record so generation and membership history remain auditable.

