# DripDex GitHub Workflow Memory

Use GitHub Issues as the coordination layer for DripDex MVP work.

- One issue, one branch or worktree, one agent/session.
- Every issue needs goal, scope, out-of-scope, inputs, acceptance criteria, verification, agent lane, risk, dependencies, and handoff notes.
- Codex owns backend/data contracts, tests, image/EXIF processing, privacy logic, schema validation, GitHub issue maintenance, and integration.
- Claude can explore frontend interactions, copy, accessibility, and isolated UI implementation.
- Gemini can explore visual design, multimodal identification prompts, capture/photo critique, and screenshot-based UI critique.
- Human owner makes final product taste, privacy, safety, source-validation, and merge decisions.
- Frontend exploration outputs from Claude/Gemini are competing sketches, not parallel code to merge together.
- Prefer small draft PRs tied to one issue.
- For Codex-owned MVP PRs, run `/code-review` when implementation is done, fix every actionable finding, rerun verification, then use GitHub automerge when available or direct squash merge when private-repo branch protection/automerge is unavailable.
- If `/code-review` finds a large or out-of-scope issue, research it enough to create a scoped follow-up GitHub issue instead of expanding the current PR.
- Escalate merges only for product taste, privacy/safety decisions, secrets, destructive data changes, or unclear requirements.
- Require verification evidence before marking work done.
- When the final child task for an epic is completed and verified, close the parent epic, mark its Project status Done, and leave a parent closure comment listing the completed children and any split-out follow-ups.
- If an epic still has external-model exploration or explicitly deferred child work open, leave the epic open unless the user intentionally rescopes those children out of the parent.
- Keep MVP lightweight and YAGNI: fixture-backed first, low infrastructure, no heavyweight process beyond GitHub Issues/Projects coordination.
