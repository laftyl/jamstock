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

