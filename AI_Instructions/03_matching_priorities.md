# 03 — Matching Priorities (Tie-breakers & Soft Preferences)

## 1. Friend requests
Can people request to be with (or not be with) specific other people? Is this on the form? Is it a hard rule or best-effort? 
No friend requests.

## 2. Genre preference
Does genre matter for grouping, or is it just informational/not used in matching?

## 3. Availability
Is everyone available for the full 48 hours, or could there be partial availability that affects grouping?

## 4. Priority order
If multiple rules conflict (e.g. filling required roles vs. skill balance vs. friend requests), what should the algorithm prioritize first, second, third?
(example ranking: 1. required roles filled, 2. skill balance, 3. friend requests, 4. genre)

## 5. Randomness
When multiple valid groupings exist, should the algorithm pick randomly, or is there a preferred tiebreaker (e.g. sign-up order/first-come-first-served)?

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
