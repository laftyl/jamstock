# Agent Registry — Authoritative

This file is the single source of truth for agent lifecycle, approvals, and task ownership.
Any agent MUST read this file before accepting work, and MUST refuse to act if its own status is not `ACTIVE`.

Lifecycle states: `ACTIVE` · `RETIRED` · `DELETED`

## Agents

| ID | Display name | Config file | Status | Tools | Since | Notes |
|---|---|---|---|---|---|---|
| `Manager_Mike` | Manager Mike | `.github/agents/Manager_Mike.agent.md` | ACTIVE | read, search, todo, edit (registry only), subagents | 2026-09-29 | Orchestrator and default entry point |
| `Product_Pete` | Product Pete | `.github/agents/Product_Pete.agent.md` | ACTIVE | read, search, edit (docs only) | 2026-09-29 | Product Manager. Owns `AI_Instructions/` |
| `Designer_DeeDee` | Designer DeeDee | `.github/agents/Designer_DeeDee.agent.md` | ACTIVE | read, search, web, edit (after approval) | 2026-09-29 | Product Designer. Owns UX/UI specs |
| `Developer_Dan` | Developer Dan | `.github/agents/Developer_Dan.agent.md` | ACTIVE | read, search, edit, execute, todo | 2026-09-29 | Software Developer. Only agent that may change app code |

**Owner:** Alixander (product owner, final decision-maker).
**Default operating mode:** ADVISORY — no application code changes without explicit, plan-versioned approval.

## Lifecycle log

| Date | Agent | Action | Reason | Tasks affected |
|---|---|---|---|---|
| 2026-09-29 | all four | CREATED | Initial team stand-up | none |
| 2026-09-29 | all four | RENAMED | Owner asked for persona filenames (`Manager_Mike`, `Product_Pete`, `Designer_DeeDee`, `Developer_Dan`). Instructions unchanged apart from cross-references | none |

### How to retire an agent
Owner says e.g. "Retire Product Pete." Then:
1. Set that row's Status to `RETIRED` and add a Lifecycle log entry.
2. Set `user-invocable: false` **and** `disable-model-invocation: true` in its `.agent.md` frontmatter.
3. Remove its ID from Manager Mike's `agents:` frontmatter list.
4. Reassign or cancel its open tasks per the owner's instruction; record what happened.
5. Preserve all completed work and history. Do not reactivate without explicit authorization.

### How to delete an agent
Same as retirement, plus delete the `.agent.md` file. Status becomes `DELETED`; the registry row and lifecycle log **stay**. Shared history in `AI_Instructions/`, this file, and git are never removed as a side effect.

### Recovering from a retired Manager
Pete, DeeDee, and Dan remain directly selectable in the VS Code agent picker. Lifecycle administration is done by editing this file and the `.agent.md` frontmatter directly — it never requires Manager Mike.

## Approval log

Approval must name a plan version and scope. Silence or general enthusiasm is not approval.

| Date | Plan ID | Scope | Decision | Owner wording |
|---|---|---|---|---|
| 2026-09-29 | — | Create the four agent configs, this registry, and `CODEBASE_MAP.md` | APPROVED | "Please follow the instructions to create agents" |

## Tasks

Statuses: `BACKLOG` `READY` `IN_PROGRESS` `BLOCKED` `IN_REVIEW` `AWAITING_APPROVAL` `DONE` `CANCELLED` `FAILED`

| ID | Description | Definition of done | Owner | Status | Depends on |
|---|---|---|---|---|---|
| T-001 | Stand up the AI product team | 4 agent configs + registry + codebase map exist and are selectable in VS Code | Manager_Mike | DONE | — |
| T-002 | Decide which requirements gap to tackle first (see `Agents/CODEBASE_MAP.md` → Known gaps) | Owner picks a gap; Pete writes a brief with acceptance criteria | Product_Pete | READY | T-001 |
| T-003 | Fix the broken import (2026-10-03) | Root cause was `better-sqlite3@11.10.0` aborting the Node 24 process (`Assertion failed: (env) != nullptr`) during GC mid-request, not application code. Upgraded to `12.11.1`, pinned `engines.node >= 22`, added `test/import.test.js`. All four sample files import; 15 tests pass. | Developer_Dan | DONE | — |
