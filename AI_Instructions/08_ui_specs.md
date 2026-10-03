# 08 — Event-Day UI Specifications

Status: **design handoff for Developer Dan; requirements below are not implemented.** Owner decisions D-1 through D-6 recorded 2026-10-03. Existing component vocabulary and DOM structure in `public/` remain authoritative; this document does not authorize app-code changes.

## Product direction

Use a **light interface**: pale lavender paper, white surfaces, deep-plum text, and restrained violet/fuchsia accents. Laptop and iPad use in an unpredictable live-event room makes light surfaces easier to read across changing ambient light and avoids relying on luminous text against a dark background. Neon character belongs in saturated accent surfaces, not body text. Keep Space Grotesk/DM Mono and the existing visual language; soften corners without changing DOM architecture.

The D-6 stylesheet reskin preserves all existing token names. WCAG 2.x contrast ratios below are rounded to one decimal. These cover every text/background pair introduced or retained by the reskin; the existing white input background is included.

| Text | Background | Ratio | Use |
|---|---|---:|---|
| `--ink #24152f` | `--paper #f5f1fa` | 15.4:1 | Body and labels |
| `--ink #24152f` | Lavender corner glow `#eee2ff` | 13.9:1 | Text over body radial |
| `--ink #24152f` | `--panel #fffdff` / `#fff` | 17.0:1 / 17.2:1 | Cards and input text |
| `--muted #62536b` | `--paper #f5f1fa` | 6.4:1 | Secondary text |
| `--muted #62536b` | `--panel #fffdff` | 7.0:1 | Secondary text on cards |
| `--muted #62536b` | Lavender corner glow `#eee2ff` | 5.7:1 | Secondary text over body radial |
| `--teal #7040a6` | `--paper #f5f1fa` / `--panel #fffdff` | 6.3:1 / 7.0:1 | Eyebrows and accent text |
| `--teal #7040a6` | Lavender corner glow `#eee2ff` | 5.7:1 | Accent text over body radial |
| White | `--teal #7040a6` | 7.1:1 | Primary button |
| White | `--coral #a51f70` | 6.9:1 | Danger button and accent metric |
| White | `--ink #24152f` | 17.2:1 | Dark metric card |
| `--ink #24152f` | `--yellow #e3c7ff` | 11.3:1 | Auth-card offset shadow/status-pill text |
| `--teal #7040a6` | `#e9ddf7` | 5.4:1 | Status chip |
| `--ink #24152f` | `#fff2d8` | 15.5:1 | Notice |
| `--ink #24152f` | `#f7eaf7` | 14.8:1 | Import box |
| `#962b43` | `--paper #f5f1fa` / `--panel #fffdff` | 6.9:1 / 7.6:1 | Error text |
| `--line #91839d` | `--paper #f5f1fa` / `--panel #fffdff` | 3.2:1 / 3.5:1 | Control and card boundaries (non-text) |
| `--coral #a51f70` | `--paper #f5f1fa` / `--panel #fffdff` / `#eee2ff` | 6.2:1 / 6.8:1 / 5.6:1 | Focus outline (non-text) |

All tabulated pairs exceed WCAG AA for normal text. Focus outlines use `--coral` against the page/surface and exceed 3:1. No neon hue is used for small text on a dark surface.

## Flow

1. Admin signs in; the password is masked. On authentication failure, the inline error stays visible and the password field remains usable.
2. Admin opens **Needs attention** to scan blocker, warning, and informational items. Selecting a band/member shows evidence and ranked remedies before any change.
3. For a move, admin selects a person, compares destinations by least conflict, inspects both affected bands and unresolved flags, then confirms. A destination that retains a hard conflict requires a second explicit confirmation; the app never claims that conflict was fixed.
4. Admin previews an import, filters invalid/excluded/duplicate rows, inspects reason and source row, then commits eligible rows only. If a row needs correction, admin fixes the source sheet and previews again.
5. Roster and band views show every primary instrument, including eight-instrument overflow; long lists wrap instead of disappearing behind ellipsis.

Unhappy paths: stale suggestions are rejected and refreshed; failed moves leave both bands unchanged; malformed preview responses show an error and preserve the selected file; empty results give a clear next action; no participant or import row silently disappears.

## Screen spec

### Needs attention (new fifth dashboard tab)

**Purpose/layout:** one prioritized work queue, not another summary count. Reuse `.tabs`, `.content-panel`, `.section-heading`, `.section-actions`, `.search`, `.list`, `.list-row`, `.status`, `.muted`, and `.button`. Group band flags under each band, followed by member-level and unassigned-person flags. Sort `BLOCKER`, `WARNING`, `INFO`, then matching-priority rank, then stable entity name. Show counts by severity; filter by severity/entity type and search. An expandable detail disclosure in each `.list-row` is closest to the existing roster row and is needed to inspect evidence/remedies without leaving the queue. Each row offers **Open band** or **Open participant**.

Expanded detail shows the plain-language reason, affected criterion and measured value, action that can help, and ranked suggestions. Each suggestion states what improves, what stays unresolved, and the expected after-state. Severity uses text and an icon/shape as well as color; never color alone.

**Copy:** tab `Needs attention`; heading `Needs attention`; empty `No matching issues. All reported constraints are currently clear.`; loading `Loading attention items…`; error `Could not load attention items. Retry`; success `Issue updated. Refreshing affected bands…`.

**States:** empty when no flags; loading uses an inline loading row; error retains filters and offers Retry; success refreshes the entity and queue and announces the changed flag count in a live region. No full-screen overlay.

**Dan contract:** authenticated `GET /api/attention` returns `{ generatedAt, counts: { BLOCKER, WARNING, INFO }, items: Flag[] }`. `Flag` is `{ id, severity: 'BLOCKER'|'WARNING'|'INFO', code, entity: { type: 'band'|'participant', id, name }, bandId?: number, participantId?: number, priorityRank: number, title, message, metric?: { current, target, unit }, remedyIds: string[] }`. Codes are stable; reasons are not inferred from message text. `GET /api/attention/:id/suggestions` returns `{ flagId, suggestions: Suggestion[] }` using the same ranking/result contract as Move. Missing data is an explicit error, never empty-success. Derive severity from `04_open_questions.md` F2 and `06_build_readiness_form.md` §M; §M hard constraints yield `BLOCKER`, not a soft warning.

### Move participant (from a band row or Unassigned)

**Purpose/layout:** select **Move…** from a member row, then show destinations grouped into **Best fit** and **Other options**, sorted by shared minimal-conflict ranking. Reuse `.content-panel`, `.section-heading`, `.list`, `.list-row`, `.status`, `.muted`, and `.button`; an expanded `.list-row` is the closest fit because each choice compares outcomes, not just names. Show source and destination before/after summaries side by side: size, required roles, producer assignment/capacity, and shared availability. No drag-and-drop.

Each option shows rank and plain-language **Works** and **Still unresolved** lines. Mark hard-conflict candidates `Cannot be resolved by this move` and state why. They remain visible for informed manual override; selecting one requires a second confirmation naming the blocker and after-state. A hard violation is never presented as resolved and remains a `BLOCKER`. `Unassigned` is always a destination.

**Copy:** `Move…`; chooser `Move [person]`; `Best fit`; `Works`; `Still unresolved`; `Cannot be resolved by this move`; confirmation `Move [person] to [band]?`; second confirmation `This move leaves a BLOCKER: [reason]. Move anyway?`; success `Moved [person]. Both bands were rechecked.`; stale result `The bands changed since these suggestions were calculated. Refresh suggestions.`

**States:** loading shows destination placeholders and disables confirmation; empty destinations explains why and offers `Move to Unassigned`; error preserves context and allows retry; success refreshes both bands, attention queue, and unassigned count. Commit failure leaves the pre-move state visible.

**Dan ranking/data contract:** share one deterministic scorer with generation; no UI-only scorer. `POST /api/participants/:id/move-options` returns `{ participantId, source: BandImpact, destinations: DestinationOption[], rankingVersion }`. Sort by `conflictVector` ascending using **lexicographic**, not summed/weighted, comparison: `[rank1Penalty, rank2Penalty, rank3Penalty, rank4Penalty, rank5Penalty, rank6Penalty]`; ties use stable destination band id. Thus any rank-2 availability penalty sorts after a zero-rank-2 option regardless of rank-6 genre gains. Document normalization per component and include raw metrics so the UI does not reverse-engineer scores.

`BandImpact` is `{ bandId: number|null, name: string, before: BandState, after: BandState }`. `BandState` contains `{ memberCount, sharedAvailabilityBlocks, requiredRoles: { percussion, bass, melody, rhythm }, producer: { assigned, withinCapacity }, flags: Flag[] }`. `DestinationOption` is `{ destinationBandId: number|null, destinationName: string, conflictVector: number[], rank: number, sourceImpact: BandImpact, destinationImpact: BandImpact, works: ConstraintEffect[], unresolved: ConstraintEffect[], requiresBlockerConfirmation: boolean }`. A `ConstraintEffect` is `{ code, severity, result: 'resolved'|'improved'|'unchanged'|'worsened'|'introduced', before, after, message }` with typed values where possible. Every candidate accounts for both source and destination.

Commit with `POST /api/participants/:id/move`, body `{ destinationBandId: number|null, suggestionId, acknowledgeBlockers: boolean, lockAffectedBands: boolean }`; return `{ ok, undoId, source: BandState|null, destination: BandState|null, flags: Flag[] }`. Revalidate and atomically update memberships/flags. Reject stale `suggestionId` with `409` plus refreshed options; never trust a client score. Record timestamp, participant, source/destination, accepted vector, blocker acknowledgements, and lock choice for undo/audit. `null` band id means Unassigned. Producer assignment is not implicitly transferred; report producer-capacity effects separately.

### Import preview (enhance existing Import panel)

**Purpose/layout:** summary counts above a reviewable table. Reuse `.content-panel`, `.section-heading`, `.section-actions`, `.search`, `.status`, `.notice`, and `.button`; a table is better than `.list-row` for accessible comparison of row number, status, and reason. Columns: **Source row**, **Status**, **Name / email**, **Reason**, **Duplicate of** (when relevant), **Review**. Expand a row to inspect all imported fields, including missing required values. Filters: All, Eligible, Excluded, Invalid, Duplicate; search name/email/reason. Commit selected eligible rows only; invalid/excluded/duplicate rows are never silently committed. Actions: `Save eligible rows`, `Choose another file`. No in-app eligibility override.

**1,000-row behavior:** one preview response; retain all rows and totals client-side, render 50 rows per page, and calculate filters/search/counts over the full set. Do not render 1,000 DOM rows. Page changes preserve filter and selection. Show `Rows 1–50 of 1,000`; keyboard-accessible pagination; no row disappears at a page boundary. No per-row request or database query.

**Copy:** `Review import`; `Eligible`; `Excluded`; `Invalid`; `Duplicate`; reason names the failed field/rule (not only `Eligibility rule`); empty filter `No rows in this category.`; loading `Reading and checking rows…`; error `Could not preview this file. No rows were saved.`; success `Preview ready. Nothing has been saved yet.` then `Import complete: [n] rows saved; [n] skipped.`

**States:** empty prompts for CSV/XLSX; loading retains selected filename and disables duplicate submit; error retains file and allows retry; success keeps table until commit, then reports inserted/skipped counts and refreshes dashboard. Commit error retains preview and selection.

**Dan contract:** preserve `POST /api/import/preview` but extend each row with `{ previewRowId, sourceRow, status, reasonCodes: string[], reasonText: string, duplicateOf?: { sourceRow, normalizedEmail }, participant: { first_name, last_name, email, primary_instruments: string[], ... } }`. Response `{ previewId, total, counts: { eligible, excluded, invalid, duplicate }, rows: PreviewRow[] }`. `sourceRow` is spreadsheet row number with documented header-row convention. Duplicates identify retained row or existing-record id, including emails already in DB. `reasonCodes` are stable and may contain multiple causes; `reasonText` is row-specific and rendered as text. Preserve source fields for row detail without treating arbitrary keys as markup. Commit by `previewId` and selected eligible `previewRowId`s, not a client-resubmitted row copy; reject expired/unknown previews and return per-row outcomes. Expire preview data; never persist excluded/invalid rows, per §B.

### All primary instruments (roster and band cards)

**Purpose/layout:** render each primary instrument as a discrete, individually escaped chip; label singular for one and plural for more than one. In `.list-row`, chips wrap inside `.person-details`; row height grows and values are not clipped/ellipsized. In `.band-card`, chips wrap inside the member's existing `<li>`, with experience/mentorship below. Eight values wrap across lines, all visible, without widening the grid. Add `aria-label="Primary instruments"` to the chip group. If an instrument covers a role, append readable role text (e.g. `Bass · covers melody`); color is not the only indicator.

**Copy/states:** `Primary instrument` for one; `Primary instruments` for two or more; no value shows `Primary instruments: Needs review`; eight values show all eight with no `+N` truncation. Loading/empty/error/success follow the parent roster/band state. Missing data is explicit `Needs review`, never blank.

**Dan data contract:** every UI person object exposes `primary_instruments: string[]`, including `displayParticipant()`, dashboard participants and band members. Parse checkbox input once in normalization; trim, discard empty entries, preserve distinct labels, and retain every selection. Do not send a comma-joined string as the display contract. Escape every string at render time. Keep `primary_instrument` only as migration/input if needed, not as UI contract. If role attribution is available, add `primary_instrument_roles: { instrument: string, roles: string[] }[]`; renderer must not guess mappings. This depends on TD-4 and is a correctness change, not styling alone.

## Style deltas

Implemented for D-6 in `public/styles.css`, preserving DOM and class names:

- Keep token names; values: `--ink #24152f`, `--muted #62536b`, `--paper #f5f1fa`, `--panel #fffdff`, `--line #91839d`, `--teal #7040a6`, `--coral #a51f70`, `--yellow #e3c7ff`.
- Change the warm corner radial to pale lavender `#eee2ff`; this remains the only gradient.
- Preserve the auth-card `18px 18px 0 var(--yellow)` hard-offset shadow.
- Add 16px auth-card, 12px surface/card/import/notice, 8px control, and 999px chip radii. Interactive buttons/inputs are at least 44px high; tabs 48px.
- `.metric-accent` text is white; `.status` uses `#e9ddf7` with `var(--teal)`; `.notice` uses `#fff2d8`; `.import-box` uses `#f7eaf7`; `.error` uses `#962b43`; band-card uses `var(--panel)`.
- Add `:focus-visible` with a 3px `var(--coral)` outline and 3px offset.
- Keep the single `@media (max-width: 760px)` block. Do not add classes until Dan implements the corresponding markup; instrument chips need a wrapping group adjacent to `.person-details`.

## Accessibility

- Contrast: at least 4.5:1 normal text and 3:1 large text, meaningful boundaries, and focus. Ratios for the reskin's text pairs are tabulated above. Recalculate any new accent/text pairing; do not put small white text on a dark neon surface without checking.
- Keyboard: tab through navigation, filters, disclosures, destination choices, pagination, and confirmations in visual order. Enter/Space activate controls; Escape closes a chooser without committing. No drag-only workflow.
- Focus: retain the visible 3px outline with 3px offset. Expanded content follows its disclosure trigger in tab order.
- ARIA: native buttons/actions and native table caption/headers. Disclosures use `aria-expanded`/`aria-controls`; asynchronous outcomes use a polite live region and errors assertive. Use `role=tablist`/`role=tab`/`aria-selected`/`aria-controls` only with a complete tab pattern; otherwise keep navigation buttons and expose current state with `aria-current`.
- Targets: minimum 44×44 CSS px for interactive controls, including row expanders, filters, pagination, and confirmations; provide spacing between adjacent targets.
- Severity/status is text plus icon/shape, never color alone. Instrument chips remain text and individually escaped.

## Responsive

Keep the one current `@media (max-width: 760px)` block. Below 760px, let the fifth tab join horizontally scrollable tabs; stack attention details, source/destination summaries, and section actions; preserve 44px targets; use 50-row import pagination with horizontally scrollable table content and persistent column labels; wrap instruments without clipping. At 1024px landscape retain the wide dashboard. At 768px portrait the current media query does not activate, so the five-column desktop roster remains; this is a specific visual-check risk. Browser verification was unavailable, so neither iPad size is claimed as visually verified. Resolve the breakpoint question in D-7 before changing 760px.

## Open questions

- **D-7:** approve widening the existing breakpoint from 760px to 820px so a 768px iPad portrait uses the compact roster, or keep 760px and accept/verify the five-column roster at 768px? The owner expects iPad use and 768px is just outside the current breakpoint.