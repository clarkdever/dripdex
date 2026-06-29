---
name: dripdex-github-workflow
description: Use for DripDex MVP planning, implementation, issue creation, PR work, handoffs, or any multi-agent/LLM collaboration involving GitHub Issues, GitHub Projects, branches, worktrees, or build coordination.
---

# DripDex GitHub Workflow

Use this skill before starting DripDex MVP implementation, creating issues, opening PRs, handing work to another model/session, or coordinating Claude/Gemini/Codex work.

## Core Rule

One issue, one branch or worktree, one agent/session.

Every work item should have:

- Goal: one sentence of user value.
- Scope: exact files/modules expected to change.
- Out of scope: what this issue must not touch.
- Inputs: spec sections, fixture files, mockups, or source links.
- Acceptance criteria: observable checklist.
- Tests/verification: exact command or manual check.
- Agent lane: Codex, Claude, Gemini, human, or unassigned.
- Risk: privacy/security, license/content, data contract, visual quality, or low.
- Dependencies: blocked by or related issues.
- Handoff notes: decisions, changed files, verification, blockers, next action.

## Agent Lanes

- Codex: backend/data contracts, tests, image/EXIF processing, privacy logic, schema validation, GitHub issue maintenance, integration.
- Claude: frontend interaction alternatives, copy polish, component structure review, accessibility review, isolated UI implementation.
- Gemini: visual design exploration, multimodal identification prompts, capture/photo critique, screenshot-based UI critique.
- Human owner: product taste, safety/privacy decisions, source validation, merge approval.

Do not let multiple agents edit the same files in parallel unless one agent is doing read-only review.

## Frontend Exploration

When Claude and Gemini both explore frontend design:

1. Create a parent design exploration issue.
2. Create one sub-issue per model with identical source material and acceptance criteria.
3. Require screenshots, rationale, and a short "what to steal" summary.
4. Treat outputs as competing sketches.
5. Do not merge both implementations.
6. Integrate only the selected direction in a separate issue/branch.

## Branch And PR Rules

- Use small PRs tied to one issue.
- Prefer draft PRs for agent-generated work.
- Use git worktrees or separate branches for simultaneous work.
- Record the issue number in branch names when practical, for example `codex/12-fixture-loader`.
- Before commit/push, run the issue's verification steps and `git status -sb`.
- Before merging Codex-owned MVP work, run a `/code-review` pass, fix every actionable finding, rerun verification, then merge without waiting for routine human review.
- If `/code-review` finds a large or out-of-scope issue, research it enough to write a useful follow-up issue with scope, acceptance criteria, verification, risk, and dependencies instead of expanding the current PR.
- Use GitHub automerge when available, or direct squash merge when private-repo branch protection/automerge is unavailable, for Codex-owned MVP PRs after code review and verification pass. Escalate only for product taste, privacy/safety decisions, secrets, destructive data changes, or unclear requirements.
- Before stopping, leave a handoff comment or note.

## DripDex MVP Build Order

1. Repository scaffold and app shell.
2. Fixture loader and typed data contracts.
3. Collection index and card browsing.
4. Creature journal page.
5. EXIF/image processing tests and utilities.
6. Capture draft persistence.
7. Identification adapter and mystery workflow.
8. Private journal dashboard and map.
9. Guestbook/public publishing controls.
10. OSS deployment and GitHub Pages docs.

## References

- Canonical spec: `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`
- Fixture contract: `docs/fixtures/README.md`
- Synthetic EXIF fixtures: `tests/fixtures/exif/README.md`
- Project memory fallback: `.codex/memories/dripdex-github-workflow.md`
