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
- Require verification evidence before marking work done.
- Keep MVP lightweight and YAGNI: fixture-backed first, low infrastructure, no heavyweight process beyond GitHub Issues/Projects coordination.
