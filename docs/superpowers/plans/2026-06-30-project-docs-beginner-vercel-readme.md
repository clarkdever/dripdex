# Project Docs And Beginner Vercel README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reviewable GitHub Pages project-docs outline and a beginner-friendly README path for cloning, previewing, and deploying DripDex to a Vercel Hobby account.

**Architecture:** Keep the first pass documentation-only. The README is the user-facing quickstart; the Pages outline is the reviewed content contract before any `gh-pages` branch or Pages workflow is built; existing DripDex workflow notes capture future parent-epic cleanup behavior.

**Tech Stack:** Markdown, GitHub Issues/Projects, GitHub Pages static-site planning, Vercel Hobby deployment guidance, Next.js 16 app commands from `package.json`.

## Global Constraints

- Do not build or publish a `gh-pages` branch until the Pages outline has been reviewed and approved.
- Do not add affiliate links or affiliate disclosure text.
- Use the plain Vercel signup URL: `https://vercel.com/signup`.
- Treat Vercel Hobby as appropriate for fixture-backed public preview only until durable auth, database, and storage adapters are implemented.
- Do not commit secrets, real API keys, owner email addresses, private coordinates, private originals, or synthetic EXIF fixture images into public docs.
- Preserve the current Node engine requirement from `package.json`: `>=22.13 <23`.
- Verification for the final PR is `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=moderate`, and manual docs review.

---

### Task 1: Capture Workflow And Implementation Plan

**Files:**
- Modify: `.codex/skills/dripdex-github-workflow/SKILL.md`
- Modify: `.codex/memories/dripdex-github-workflow.md`
- Create: `docs/superpowers/plans/2026-06-30-project-docs-beginner-vercel-readme.md`

**Interfaces:**
- Consumes: DripDex workflow rules, issue #63, Project board fields.
- Produces: A tracked plan and updated internal rule for closing parent epics after their last child task is verified.

- [ ] **Step 1: Confirm branch and issue context**

Run:

```bash
git status -sb
gh issue view 63 --json number,title,state,labels
```

Expected: branch is `codex/63-docs-readme-vercel-preview`; issue #63 is open and labeled `type:task`, `lane:codex`, `slice:devops`, `risk:license-content`, `priority:p2`.

- [ ] **Step 2: Add parent epic cleanup guidance**

Add this section to `.codex/skills/dripdex-github-workflow/SKILL.md` after the Branch And PR Rules section:

```markdown
## Parent Epic Cleanup

- When completing or closing a child task, check the parent epic or linked sub-issues.
- If the task was the final child and verification is recorded, close the parent epic and mark its Project status Done in the same session.
- Leave a closure comment on the parent listing the completed child issues and any follow-up issues that were split out of scope.
- If only external-model exploration or explicitly deferred work remains, leave the parent open unless the user intentionally rescopes those issues out of the epic.
```

Add this guidance to `.codex/memories/dripdex-github-workflow.md`:

```markdown
- When the final child task for an epic is completed and verified, close the parent epic, mark its Project status Done, and leave a parent closure comment listing the completed children and any split-out follow-ups.
- If an epic still has external-model exploration or explicitly deferred child work open, leave the epic open unless the user intentionally rescopes those children out of the parent.
```

- [ ] **Step 3: Verify markdown-only diff**

Run:

```bash
git diff --check
```

Expected: no output.

---

### Task 2: Rewrite README For Beginner Preview And Agent Deployment

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `package.json` scripts and Node engine, Vercel public signup URL, docs checklist caveats from `docs/superpowers/plans/2026-06-30-oss-environment-deployment-checklist.md`.
- Produces: A plain-English README that a non-coder can follow or hand to an agent.

- [ ] **Step 1: Replace the short README with a beginner structure**

Use this structure:

```markdown
# DripDex

## What DripDex Is
Define DripDex as a mobile-first Texas Hill Country field guide and personal nature journal for kids, families, teachers, clubs, and naturalists.

## What Works Today
Explain that the repo is a fixture-backed MVP preview and list the implemented preview surfaces.

## Before You Start
List the required accounts and tools: GitHub, Vercel, Node.js `>=22.13 <23`, and npm.

## Try It On Your Computer
Show clone, install, dev server, and optional owner journal preview commands.

## Deploy A Public Preview On Vercel Hobby
Explain the Vercel Hobby preview path and the private-upload/storage caveat.

## Copy-Paste Prompt For An Agent
Provide a complete prompt for an agent to check tools, request installs, authenticate, clone, verify, and deploy.

## Important Privacy Notes
Summarize public derivative, private original, exact GPS, home-zone, and guestbook moderation boundaries.

## Developer Checks
List lint, typecheck, test, build, and audit commands.

## Deeper Project Docs
Link to the product spec, GitHub Pages plan, OSS deployment checklist, and fixture source notes.
```

- [ ] **Step 2: Include exact local commands**

The local setup section must include:

```bash
git clone https://github.com/clarkdever/dripdex.git
cd dripdex
npm install
npm run dev
```

The checks section must include:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

- [ ] **Step 3: Include the Vercel Hobby preview caveat**

The Vercel section must say:

```markdown
This is a good path for a public, fixture-backed preview of DripDex. It is not yet the full private family/classroom hosting story for real uploads, private originals, SQLite writes, exact GPS, or durable image storage.
```

- [ ] **Step 4: Include the Vercel signup link without affiliate text**

Use exactly:

```markdown
[Sign up for Vercel](https://vercel.com/signup)
```

Do not include `affiliate`, `partner`, or tracking parameters anywhere in `README.md`.

- [ ] **Step 5: Add the agent prompt**

The prompt must tell the agent to:

- Ask the user to create or sign into GitHub and Vercel accounts.
- Check for `git`, Node/npm, `gh`, and `vercel`.
- Ask permission before installing missing CLI tools.
- If MCP/connectors/plugins are available, request GitHub and Vercel connectors when absent.
- Run `gh auth status`; if needed, ask the user to complete `gh auth login`.
- Run `vercel whoami`; if needed, ask the user to complete `vercel login`.
- Clone `https://github.com/clarkdever/dripdex.git`.
- Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Deploy with Vercel after local checks pass.
- Warn the user not to upload private real observations yet.

- [ ] **Step 6: Manual README scan**

Run:

```bash
rg -n "affiliate|utm_|ref=|api key|secret|exact GPS|private original" README.md
```

Expected: no affiliate/tracking text; privacy warnings may mention exact GPS and private originals only as things not to expose or upload yet.

---

### Task 3: Prepare GitHub Pages Outline For Review

**Files:**
- Create: `docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md`

**Interfaces:**
- Consumes: `docs/superpowers/plans/2026-06-30-github-pages-product-docs-plan.md`, approved mockup/image inventory, README quickstart.
- Produces: A reviewable content outline that must be approved before any `gh-pages` branch or Pages workflow is built.

- [ ] **Step 1: Create the outline document**

Create `docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md` with these sections:

```markdown
# GitHub Pages Preview Outline

Date: 2026-06-30
Status: Draft for owner review before Pages branch build
Issue: #63

## Review Gate

No `gh-pages` branch, Pages workflow, or public Pages deployment should be created until this outline is reviewed and approved.

## Site Goals
Explain the intended audience, product-preview purpose, privacy posture, and static-first publishing approach.

## Proposed Pages
List `index.html`, `build-your-own.html`, `privacy-and-safety.html`, and `fixture-sources.html`.

## Home Page Outline
Define the homepage message, content blocks, screenshot usage, and calls to action.

## Build Your Own Page Outline
Define the local preview, Vercel Hobby preview, account checklist, and current hosting caveats.

## Privacy And Safety Page Outline
Define the EXIF, private original, exact GPS, home-zone, sensitive-species, guestbook, AI-review, and field-safety copy.

## Fixture Sources Page Outline
Define source/license/credit/validation content and fixture table fields.

## Screenshot Inventory
List the approved screenshots with captions, status labels, and privacy notes.

## Links And Calls To Action
List required repository, Vercel signup, product design, deployment checklist, and fixture-source links.

## Non-Goals For First Pages Build
List analytics, affiliate links, private data, synthetic EXIF images, docs frameworks, and premature deployment as non-goals.

## Open Review Questions
Ask the owner to decide preview-link timing, private dashboard screenshot placement, fixture table depth, and handwritten versus generated static Pages implementation.
```

- [ ] **Step 2: Include required pages**

The proposed pages must be:

- `index.html`
- `build-your-own.html`
- `privacy-and-safety.html`
- `fixture-sources.html`

- [ ] **Step 3: Include screenshot inventory**

List these screenshots with captions and status labels:

- `docs/mockups/collection-view-public-default.png`
- `docs/mockups/collection-view-intro-hidden.png`
- `docs/mockups/collection-view-guestbook-open.png`
- `docs/mockups/collection-view-guestbook-pending.png`
- `docs/mockups/collection-view-favorites-groups.png`
- `docs/mockups/mystery-investigation-flow-all-views.png`
- `docs/mockups/private-journal-dashboard-all-tabs.png`

- [ ] **Step 4: Include non-goals**

The non-goals must include:

- No analytics, tracking scripts, newsletter forms, or comment widgets.
- No affiliate links.
- No private originals, exact GPS, or synthetic EXIF test images.
- No full docs framework until static pages are too limiting.
- No Pages deployment before outline approval.

- [ ] **Step 5: Manual outline scan**

Run:

```bash
rg -n "gh-pages|affiliate|utm_|exact GPS|synthetic EXIF|private original" docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md
```

Expected: mentions are limited to the review gate and safety/non-goal warnings.

---

### Task 4: Verify, Commit, Push, And Open Draft PR

**Files:**
- Modify: `.codex/skills/dripdex-github-workflow/SKILL.md`
- Modify: `.codex/memories/dripdex-github-workflow.md`
- Modify: `README.md`
- Create: `docs/superpowers/plans/2026-06-30-project-docs-beginner-vercel-readme.md`
- Create: `docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md`

**Interfaces:**
- Consumes: completed documentation edits.
- Produces: a draft PR for #63 that stops before Pages publication.

- [ ] **Step 1: Run full local verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

Expected: all commands pass.

- [ ] **Step 2: Final manual scans**

Run:

```bash
rg -n "affiliate|utm_|ref=" README.md docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md
rg -n "Pages site is [l]ive|public URL is [l]ive|now [p]ublished" README.md docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md
git diff --check
git status -sb
```

Expected: no affiliate/tracking text, no claim that Pages has been built or published, clean whitespace check, and only intended files changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add .codex/skills/dripdex-github-workflow/SKILL.md .codex/memories/dripdex-github-workflow.md README.md docs/superpowers/plans/2026-06-30-project-docs-beginner-vercel-readme.md docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md
git commit -m "docs: add beginner deployment docs plan"
```

- [ ] **Step 4: Push and open draft PR**

Run:

```bash
git push -u origin codex/63-docs-readme-vercel-preview
gh pr create --draft --title "docs: add beginner deployment docs plan" --body "$(cat <<'PR_BODY'
Closes #63.

## Summary
- adds a beginner-friendly README path for local preview and Vercel Hobby public preview
- adds a copy-paste agent prompt for clone/build/deploy with GitHub and Vercel auth checks
- adds a GitHub Pages preview outline for owner review before any Pages branch is built
- records the parent epic cleanup workflow note requested during issue triage

## Verification
- [ ] npm run lint
- [ ] npm run typecheck
- [ ] npm test
- [ ] npm run build
- [ ] npm audit --audit-level=moderate
- [ ] Manual docs scan: no affiliate/tracking links, no premature Pages deployment claim, no secrets

## Pages Gate
No gh-pages branch, Pages workflow, generated static site, or Pages deployment is included in this PR. The outline in docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md needs owner review before publishing work starts.
PR_BODY
)"
```

- [ ] **Step 5: Stop before Pages branch**

Do not create `gh-pages`, do not configure Pages publishing, and do not publish a Pages URL in this issue. The next issue should start only after the owner approves `docs/superpowers/plans/2026-06-30-github-pages-preview-outline.md`.

## Self-Review

- Spec coverage: #63 acceptance criteria map to Task 2 README requirements, Task 3 outline requirements, and Task 4 verification/PR steps.
- Placeholder scan: this plan intentionally uses ellipses only inside example document skeletons where the implementing task supplies prose; all executable requirements and commands are explicit.
- Type consistency: no code types or runtime interfaces are introduced.
