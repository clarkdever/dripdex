# DripDex MVP GitHub Project Setup

Use this as the fallback project setup reference if GitHub Projects cannot be created automatically from the CLI.

## Project

Name: `DripDex MVP Build`

Purpose: Coordinate MVP implementation across Codex, Claude, Gemini, and human review.

## Fields

- Status: Backlog, Ready, In Progress, Review, Blocked, Done.
- Priority: P0, P1, P2.
- MVP slice: Data Contracts, Collection, Creature Page, Capture, AI, Privacy, Journal, Public Site, DevOps.
- Agent lane: Codex, Claude, Gemini, Human.
- Worktree/branch: short text.
- Risk: privacy/security, license/content, visual quality, data contract, low.
- Verification: not started, local checks pass, screenshots captured, needs review.

## Views

- Board by Status.
- Table grouped by MVP slice.
- Table filtered to `priority:p0`.
- Table filtered to `lane:claude` or `lane:gemini` for frontend exploration.
- Table filtered to `risk:privacy-security`.

## Rules

- One issue, one branch or worktree, one agent/session.
- Use draft PRs for agent work.
- Require handoff notes before pausing.
- Require verification evidence before moving to Done.
- Treat Claude/Gemini frontend outputs as competing sketches until the human owner chooses a direction.

