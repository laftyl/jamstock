# 06 — Build Readiness Form

Fill this out before the first production build. Write `N/A`, `decide later`, or `recommend something` where needed. You can answer in plain English.

## A. Event and application setup

- Event name: RVA JamStock
- Event date(s): 01/01/2027
- 48-hour start date/time: 01/01/2027 / 6:00pm est
- 48-hour end date/time: 01/03/2027 / 6:00pm est
- Kickoff date/time/location: 01/01/2027 / 6:00pm est / In Your Ear Studios
- Showcase date/time/location: 01/03/2027 / 3:00pm est / In Your Ear Studios
- Should other devices on the same local Wi-Fi be able to use the app? (yes/no): no
- Preferred app start command, if you have one: Create a "Start" file in the main directory that I can double click on to boot the app.

## B. Eligibility

- Must a participant have purchased a ticket to be matchable? (yes/no): Yes
- Should excluded registrations be stored for audit/history? (yes/no): No
- Can an administrator override an exclusion? (yes/no): n/a
- Should Advanced alone count as a veteran? (yes/no): Yes
- Should Intermediate count as experienced? (yes/no): Yes

## C. Band structure

- Minimum members per band: 3
- Maximum members per band: 6
- Preferred target size: 4 to 5
- Does a performer/producer count toward band size? (yes/no): Performer/Producer Yes. Producer Only No
- Are vocals required, preferred, or optional? Optional but preferred
- Is percussion required, preferred, or optional? Required
- Is bass capability required, preferred, or optional? Required
- Is melodic coverage required, preferred, or optional? Required
- Is rhythmic coverage required, preferred, or optional? Required
- Are songwriting, arrangement, music theory, and sound design used as matching roles? No. Store them as participant skills and matching preferences.
- Does every band need a producer? (yes/no): Yes

## D. Matching priorities

Rank these from 1 (highest) to 8 (lowest), or replace them with your own order:

- Eligibility: 1
- Availability: 2
- Musical role coverage: 4
- Experience balance: 3
- Equipment compatibility: 5
- Genre compatibility: 6
- Producer availability: 1
- Randomness/sign-up order: not important
- Willingness to teach/mentorship matchup: 1

- Is 5 of 7 shared availability blocks a hard requirement? (yes/no): Yes, to the extent that it is possible. If it is not possible, please make a not next to the band so I can reach out to them.
- If the hard requirement fails, describe the acceptable pairwise fallback: For availability, see above. For music mentorship, pair expert class with newbie class. For music roles, utilize non-primary music roles to pair to the best of your ability. For music equipment/sharing give me ideas. For producer availability, spread give the number of songs each producer may be responsible for next to their name. If it is more than 3, create a notification for me to tell people it is a "first come first serve basis". If there is a fail for anything, create a shortlist of actions to where I can manually place people (ie if there is an overflow of guitarists, mark them and suggest bands that have a smaller number of guitarists, even if that band has 6 people. Give me ideas for other failsafes.)
- Should generation be repeatable with a saved seed? (yes/no): Yes in the case that a band drops off mid-way, I want to regenerate without screwing up the order.
- Should generation include controlled randomness? (yes/no): No.

## E. Instrument and "Other" mapping

For each instrument, list roles from highest to lowest priority. Add as many rows as needed.

| Instrument or keyword/regex | Primary roles | Secondary roles | Tertiary roles | Notes |
|---|---|---|---|---|
| Guitar | Melody, rhythm | Bass | | Use primary roles first; use bass as fallback |
| Bass | Bass, rhythm | Melody | | Protect bass as a primary role when possible |
| Keys/piano | Melody, rhythm | Bass | | Can cover bass when a band lacks bass capability |
| Percussion/drums | Percussion, rhythm | | | At least one percussion-capable participant is required |
| Vocalist | Melody | Rhythm | | Vocal coverage is preferred but optional |
| Brass | Melody, rhythm | Bass | | Refine by specific instrument when needed |
| Strings | Melody, rhythm | Bass | | Refine by specific instrument when needed |
| Winds | Melody, rhythm | Bass | | Refine by specific instrument when needed |
| Electronic musician | Production, rhythm | Melody, bass | | Can cover production and electronic performance |
| Recording/mixing engineer | Production | | | Producer-only participants are assigned separately |
| Other | Manual review | Manual review | Manual review | Unknown values are flagged until mapped |

- Should unknown "Other" answers be flagged for manual review? (yes/no): Yes
- Should the administrator be able to edit mappings inside the app? (yes/no): Yes
- These are the initial defaults. Edit any row before implementation if you disagree.
- The placement roles are melody, rhythm, percussion, bass, production, and vocals.
- Harmony is treated as part of rhythm for matching purposes.
- Songwriting, arrangement, music theory, and sound design remain participant skills, not instrument roles.
- Unknown "Other" responses are normalized with keyword/regex rules and sent to manual review when no rule matches.
- The app will count each instrument and prefer scarce instruments in their primary roles before using common instruments as fallback roles.

## F. Producers and equipment

- Maximum bands one producer may support: 5
- Can producer-only participants support multiple bands? (yes/no): Yes
- Should performer/producers be assigned as both band members and producers? (yes/no): Yes. Minimize the amount of bands they can produce to 2.
- Is equipment used as a matching requirement or only displayed as information? Required.
- Which equipment gaps should produce warnings? Any where the full band (melody, rhythm, percussion, bass, and production) cannot be supported.

Recommended equipment behavior:
- Equipment is required for finalizing a band, but missing equipment does not stop draft generation.
- Shared equipment can satisfy a band requirement.
- Missing equipment creates a visible warning naming the gap and suggesting participants who own or share that item.
- The administrator can manually approve a band after resolving an equipment issue outside the app.
- Equipment ownership and sharing details are visible to administrators, not public display mode.

## G. Administrator workflows

- Should import add to existing data or replace it by default? Add.
- How should duplicate emails be handled? Keep the most complete eligible record; delete exact duplicates; send conflicting duplicates to import review before deletion.
- Should malformed rows be skipped, imported for review, or block the import? Imported for review
- Should check-in search by name, email, or both? Both
- Can an administrator check in someone after bands are generated? (yes/no): Yes
- Can the administrator manually move people between bands? (yes/no): Yes
- Can a band be locked against automatic regeneration? (yes/no): Yes
- Can locked bands still be manually edited? (yes/no): Yes
- Should the app save previous band generations for restore? (yes/no): Yes
- Bands, members, names, emails, and future song entries should be put together and exportable.

Duplicate policy details:
- Email is the duplicate key after trimming and lowercasing.
- Do not treat matching names alone as duplicates.
- Prefer a record with a purchased ticket, valid eligibility answers, and the fewest missing fields.

## H. Data safety

- Should the app create automatic database backups? (yes/no): Yes
- How many backups should it retain? 1
- Should there be a manual export-backup button? (yes/no): Yes
- Should the app require an administrator password? (yes/no): Yes
- How long should participant data be retained after the event? Save it to my local drive in the app in a separate folder.

Password and recovery behavior:
- Create the administrator password on first launch.
- Store only a secure password hash; never store the password in project instructions.
- Use the three administrator-provided security questions for local password reset.
- Normalize and hash reset answers rather than storing them in plain text.
- Require all three answers for reset and show a warning that anyone who knows them can reset access.

## I. Output and event-day use

- Should rosters be printer-friendly? (yes/no): Yes
- Should there be a projector/display mode? (yes/no): Yes
- Should participant emails be visible in roster views? (yes/no): Yes
- Should the app show warnings for missing roles? (yes/no): Yes
- Should warnings block finalizing a band or only inform the administrator? Inform and the admin should have controls to move bands, verify and finalize bands, and any other controls you can think of.
- Should the app track a performance queue? (yes/no): Yes

## J. Acceptance test

Describe what must be true for you to call version 1 complete:

1. I can double-click a local Start file, authenticate, and resume saved data after restarting the app.
2. I can import the three 100-entry sample files, add valid rows, and review malformed, duplicate, and excluded rows.
3. I can check participants in by name or email and generate repeatable draft bands from checked-in eligible participants.
4. The generator preserves locked bands, balances experience, uses primary then fallback instrument roles, and assigns producer-only participants separately.
5. Each band shows members, roles, equipment, shared availability, producer assignments, and warnings.
6. I can manually move participants, rename bands, lock/unlock bands, verify/finalize bands, and restore an earlier generation.
7. The app warns about missing roles, equipment, availability, mentorship, producer capacity, and unassigned people without preventing manual approval.
8. I can export bands, members, emails, producers, and future song entries, and print rosters or use projector mode.
9. The app supports the performance queue and preserves one automatic backup plus manual backups.

## K. Resolved implementation defaults

- Producer-only participants do not count toward the 3–6 performer band size and appear in a separate producer assignment view.
- Performer/producers count as band members and may support no more than 2 bands.
- Producer-only participants may support no more than 5 bands.
- Producer assignments are distributed as evenly as possible using availability only as an informational display, not a matching constraint.
- If producer capacity is insufficient, draft bands are still generated and marked `Producer Needed` with a shortage count.
- If a band cannot share 5 of 7 availability blocks, it receives a prominent availability warning for manual outreach.
- The generator uses a saved deterministic seed and no uncontrolled randomness.
- The generator treats melody, rhythm, percussion, bass, production, and vocals as placement roles; music skills are stored separately.
- When matching fails, the app produces an action list: unassigned people, overflow instruments, missing roles/equipment, candidate bands for manual placement, and producer shortages.
- Duplicate records follow the duplicate policy above instead of being silently lost during import.

## L. Final decisions still needed

Approve or edit these defaults before production implementation:

1. Instrument-role mapping in Section E.
2. Equipment behavior in Section F.
3. Producer shortage behavior in Section K.
4. Duplicate handling in Section G.

The password recovery answers should be entered only in the running app during first-time setup, not saved in this file.
