# 03 — Matching Priorities (Tie-breakers & Soft Preferences)

## 1. Friend requests
Can people request to be with (or not be with) specific other people? Is this on the form? Is it a hard rule or best-effort? 
No friend requests.

## 2. Genre preference
*Answered 2026-09-29. Genre is a low-weight tie-breaker, never a driver.*

Rules:
1. Genre never overrides eligibility, availability, mentorship pairing, role coverage, equipment, or producer coverage. It is the **last** thing consulted (rank 6 in `06` §D).
2. When two or more candidate placements are otherwise equal on every higher-ranked criterion, choose the one with the greater genre overlap. "Otherwise equal" means equal on all ranks 1–5; genre may not be used to break a tie at any earlier rank.
3. Genre openness tiers come from the form's "Are you open to playing genres outside your normal style?" answer (`04` Q5):
   - **"I prefer to stay in my preferred style"** → treat as genre-sensitive. Prefer placing them in a band whose members' genre sets intersect theirs. If no such band exists after all higher-ranked constraints are satisfied, place them anyway and raise an INFO-level flag naming the mismatch. This is never a blocker.
   - **"Potentially"** → genre overlap is a mild preference; use it only at step 2 above.
   - **"Absolutely"** → genre-flexible. These participants are the preferred fill-ins used to complete bands whose genre profile does not match their own.
4. `"I'm cool with any genre"` in the genres-comfortable field is treated as matching every genre for overlap purposes.
5. Genre overlap is measured between a candidate's genre set and the union of the band's existing members' genre sets. A band is not required to have a single dominant genre.

## 3. Availability
*Answered 2026-09-29. No — assume partial availability is the norm.*

Rules:
1. Do **not** assume anyone is available for the full 48 hours. Every participant supplies a subset of the 7 blocks (Fri evening, Sat morning/afternoon/evening, Sun morning/afternoon/evening).
2. Availability is rank 2 in `06` §D and is a near-hard constraint: maximize shared overlap, and treat "all members share ≥5 of 7 blocks" as the target (`04` Q7, `06` §D).
3. Fallback when whole-band 5/7 is not achievable: fall back to pairwise — arrange the band so that pairs of members share ≥5 of 7 blocks, enabling smaller writing sessions and asynchronous collaboration (`04` Q7).
4. Any band that lands on the pairwise fallback, or drops below 5 shared blocks, is flagged for manual outreach with the actual shared-block count shown on the band (`06` §D).
5. When comparing two otherwise-acceptable placements, prefer the one that produces the **higher** whole-band shared-block count. Overlap is maximized, not merely satisfied.
6. The Friday-evening kickoff and Sunday-afternoon showcase are mandatory in-person events (`06` §A); a participant missing those blocks is an outreach flag, not an automatic exclusion.

## 4. Priority order
*Resolved 2026-09-29: already decided elsewhere. This section defers.*

**The ranked priority list in `06_build_readiness_form.md` §D is authoritative.** This section is superseded and must not be used as an independent source. Section 6 below records the owner's original grouping and is retained for intent and rationale only; where the two differ, `06` §D wins.

For reference, `06` §D ranks: **1** eligibility, producer availability, willingness-to-teach/mentorship · **2** availability · **3** experience balance · **4** musical role coverage · **5** equipment compatibility · **6** genre compatibility · randomness/sign-up order: not used.

## 5. Randomness
*Answered 2026-09-29. No randomness.*

Rules:
1. The generator contains **no** random or pseudo-random selection. Given the same participant set, the same check-in state, and the same saved seed, it must produce byte-identical band assignments (`06` §D, §K).
2. Sign-up order is explicitly **not** a matching priority (`06` §D). It is used only as the final stable tie-break in rule 3.
3. When multiple valid groupings remain after all criteria in `06` §D are applied, resolve deterministically in this order:
   1. Higher whole-band shared-availability block count.
   2. Scarcer instrument placed in its primary role (see the instrument tally model in §6 below).
   3. Lower producer load on the assigned producer.
   4. Ascending participant `id` (i.e. import/sign-up order) as the final stable tie-break, so the result is never arbitrary.
4. The "seed" required by `06` §D exists to make a regeneration reproducible after a drop-out, not to introduce variation. Re-running with the same seed and the same roster must not reshuffle unaffected bands.

## 6. (Added by me) Priority matching

Necessary
1. Willing to teach and willing to learn
2. Availability (At least 70% overlapping time)
3. Veteran musicians with newbies

Important
4. Complimentary band roles (Rhythm players, melody pklayer, percussion players, production, and anything else you can think of if needed. Note producers may be split among groups.)
5. Complimentary equipment of those willing to share. Tied with 4.

Nice to have
5. Genre matching for folks who want to stick to their genre
6. Genre matching for folks who are okay with going outside their genre

I'm also thing in regards to instrumentation and band matching:
Every instrument (and regex whatever folks put as other) should be assinged to an object. That object should include it's primary (required), secondary, tertiary, and tetrary role in regards to melodic, harmonic, percussive, etc. There can be more than one per level. For example a guitar may be primary: melody, harmony, secondary: bass. A tuba is primary: bass secondary: melody.
Each instrument should be tallied by how many people signed up to use them. Instruments with a lower tally should be prioritized to be used in their primary function. Instruments with higher tally can fill in gaps with their non-primary functions. For example, a guitar {primary: melody, harmony / secondary: bass / total: 10} and a pianist {primary: melody, harmony / secondary: bass / total: 3} should allow the guitarist to take priority over the piano if there is a shortage of bass capable instruments.
