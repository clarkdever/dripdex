# DripDex MVP GitHub Project Setup

Use this as the fallback project setup reference if GitHub Projects cannot be created automatically from the CLI.

## Project

Name: `DripDex MVP Build`

Purpose: Coordinate MVP implementation across Codex, Claude, Gemini, and human review.

Created Project: [DripDex MVP Build](https://github.com/users/clarkdever/projects/2)

## Fields

- Status: Todo, In Progress, Done.
- Priority: P0, P1, P2.
- MVP area: Data Contracts, Collection, Creature Page, Capture, AI, Privacy, Mystery, Journal, Public Site, DevOps.
- Agent lane: Codex, Claude, Gemini, Human.
- Worktree/branch: short text.
- Risk: privacy/security, license/content, visual quality, data contract, low.
- Verification: not started, local checks pass, screenshots captured, needs review.

## Views

- Board by Status.
- Table grouped by MVP area.
- Table filtered to `priority:p0`.
- Table filtered to `lane:claude` or `lane:gemini` for frontend exploration.
- Table filtered to `risk:privacy-security`.

## Created Setup

- Project number: `2`.
- Project URL: `https://github.com/users/clarkdever/projects/2`.
- Repository link: `clarkdever/dripdex`.
- Items added: 35 issues, covering parent epics `#1` through `#10` and child issues `#11` through `#35`.
- Board metadata is filled from issue labels for Priority, MVP area, Agent lane, Risk, and Verification.

## Rules

- One issue, one branch or worktree, one agent/session.
- Use draft PRs for agent work.
- Require handoff notes before pausing.
- Require verification evidence before moving to Done.
- Treat Claude/Gemini frontend outputs as competing sketches until the human owner chooses a direction.
