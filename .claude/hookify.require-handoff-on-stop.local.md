---
name: require-handoff-on-stop
enabled: true
event: stop
action: warn
pattern: .*
---

Before stopping DripDex work, leave a compact handoff:

- Current issue/planning task.
- Branch/worktree.
- Files changed.
- Decisions made.
- Verification run and result.
- Blockers or risks.
- Next recommended action.

If work touched privacy, EXIF, auth, public publishing, or source/licensing, call that out explicitly.
