---
name: require-gh-workflow-on-prompt
enabled: true
event: prompt
action: warn
conditions:
  - field: user_prompt
    operator: regex_match
    pattern: (?i)(implement|build|issue|issues|pull request|pr|branch|worktree|gemini|claude|codex|agent|frontend|backend|mvp)
---

DripDex workflow reminder:

- Read `.codex/skills/dripdex-github-workflow/SKILL.md` before starting.
- Use one issue, one branch/worktree, one agent/session.
- Keep the write scope explicit.
- If this is frontend exploration, treat Claude/Gemini outputs as competing sketches and integrate only the selected direction.
