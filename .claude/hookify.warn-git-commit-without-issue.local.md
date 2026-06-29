---
name: warn-git-commit-without-issue
enabled: true
event: bash
action: warn
pattern: git\s+(commit|push)\b
---

Before committing or pushing DripDex work, confirm:

- The work belongs to one GitHub issue or clearly documented planning task.
- `git status -sb` has been checked.
- Only intended files are staged.
- The issue's verification command or manual check has fresh evidence.
- The handoff/PR notes include changed files, tests run, blockers, and next action.
