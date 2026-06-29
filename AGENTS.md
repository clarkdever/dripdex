# DripDex Agent Instructions

Before DripDex MVP planning, implementation, issue creation, PR work, or multi-agent handoff, read and follow:

- `.codex/skills/dripdex-github-workflow/SKILL.md`
- `.codex/memories/dripdex-github-workflow.md`
- `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`

Core workflow:

- Use GitHub Issues as the coordination layer.
- Use one issue, one branch or worktree, one agent/session.
- Keep write scopes explicit.
- Prefer small draft PRs tied to one issue.
- For Codex-owned MVP PRs, run `/code-review` when implementation is done, fix every actionable finding, rerun verification, then use GitHub automerge when available or direct squash merge when private-repo branch protection/automerge is unavailable.
- Escalate merges only for product taste, privacy/safety decisions, secrets, destructive data changes, or unclear requirements.
- Leave handoff notes before pausing or stopping work.
- Run verification before claiming completion.
- Keep DripDex lightweight and YAGNI.
