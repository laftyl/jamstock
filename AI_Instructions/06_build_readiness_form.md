# 06 — Build Readiness Form

Fill this out before the first production build. Write `N/A`, `decide later`, or `recommend something` where needed. You can answer in plain English.

## A. Event and application setup

- Event name:
- Event date(s):
- 48-hour start date/time:
- 48-hour end date/time:
- Kickoff date/time/location:
- Showcase date/time/location:
- Should other devices on the same local Wi-Fi be able to use the app? (yes/no):
- Preferred app start command, if you have one:

## B. Eligibility

- Must a participant have purchased a ticket to be matchable? (yes/no):
- Should excluded registrations be stored for audit/history? (yes/no):
- Can an administrator override an exclusion? (yes/no):
- Should Advanced alone count as a veteran? (yes/no):
- Should Intermediate count as experienced? (yes/no):

## C. Band structure

- Minimum members per band: 3
- Maximum members per band: 6
- Preferred target size:
- Does a performer/producer count toward band size? (yes/no):
- Are vocals required, preferred, or optional?
- Is percussion required, preferred, or optional?
- Is bass capability required, preferred, or optional?
- Is melodic coverage required, preferred, or optional?
- Is harmonic coverage required, preferred, or optional?
- Is songwriting/arrangement coverage required, preferred, or optional?
- Does every band need a producer? (yes/no):

## D. Matching priorities

Rank these from 1 (highest) to 8 (lowest), or replace them with your own order:

- Eligibility:
- Availability:
- Musical role coverage:
- Experience balance:
- Equipment compatibility:
- Genre compatibility:
- Producer availability:
- Randomness/sign-up order:

- Is 5 of 7 shared availability blocks a hard requirement? (yes/no):
- If the hard requirement fails, describe the acceptable pairwise fallback:
- Should generation be repeatable with a saved seed? (yes/no):
- Should generation include controlled randomness? (yes/no):

## E. Instrument and "Other" mapping

For each instrument, list roles from highest to lowest priority. Add as many rows as needed.

| Instrument or keyword/regex | Primary roles | Secondary roles | Tertiary roles | Notes |
|---|---|---|---|---|
| Guitar | | | | |
| Bass | | | | |
| Keys/piano | | | | |
| Percussion/drums | | | | |
| Vocalist | | | | |
| Brass | | | | |
| Strings | | | | |
| Winds | | | | |
| Electronic musician | | | | |
| Recording/mixing engineer | | | | |
| Other | | | | |

- Should unknown "Other" answers be flagged for manual review? (yes/no):
- Should the administrator be able to edit mappings inside the app? (yes/no):

## F. Producers and equipment

- Maximum bands one producer may support:
- Can producer-only participants support multiple bands? (yes/no):
- Should performer/producers be assigned as both band members and producers? (yes/no):
- Is equipment used as a matching requirement or only displayed as information?
- Which equipment gaps should produce warnings?

## G. Administrator workflows

- Should import add to existing data or replace it by default?
- How should duplicate emails be handled?
- Should malformed rows be skipped, imported for review, or block the import?
- Should check-in search by name, email, or both?
- Can an administrator check in someone after bands are generated? (yes/no):
- Can the administrator manually move people between bands? (yes/no):
- Can a band be locked against automatic regeneration? (yes/no):
- Can locked bands still be manually edited? (yes/no):
- Should the app save previous band generations for restore? (yes/no):

## H. Data safety

- Should the app create automatic database backups? (yes/no):
- How many backups should it retain?
- Should there be a manual export-backup button? (yes/no):
- Should the app require an administrator password? (yes/no):
- How long should participant data be retained after the event?

## I. Output and event-day use

- Should rosters be printer-friendly? (yes/no):
- Should there be a projector/display mode? (yes/no):
- Should participant emails be visible in roster views? (yes/no):
- Should the app show warnings for missing roles? (yes/no):
- Should warnings block finalizing a band or only inform the administrator?
- Should the app track a performance queue? (yes/no):

## J. Acceptance test

Describe what must be true for you to call version 1 complete:

1.
2.
3.
4.
5.
