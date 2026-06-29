---
name: warn-cross-lane-edits
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: (app|src|components|lib|server|db|tests|docs/mockups)/
---

DripDex multi-agent lane check:

- Confirm this file is inside the current issue's write scope.
- Avoid editing the same files assigned to another agent/session.
- Codex should own backend/data/privacy/tests/integration work.
- Claude/Gemini frontend work should stay in isolated exploration branches/issues until a human chooses a direction.
