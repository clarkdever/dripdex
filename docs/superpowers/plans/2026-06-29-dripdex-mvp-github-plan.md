# DripDex MVP GitHub Coordination Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `dripdex-github-workflow` before creating issues, branches, worktrees, PRs, or delegating work. Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` only after a specific issue is selected for implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a file-backed MVP build plan that can be converted into GitHub labels, issue forms, parent issues, sub-issues, project fields, and agent handoffs.

**Architecture:** GitHub Issues are the build coordination layer. This file is the fallback source of truth. Parent issues define epics, child issues define one-agent work packages, and each child issue includes acceptance criteria, verification, risk, and lane ownership.

**Tech Stack:** GitHub Issues, GitHub Projects, GitHub issue forms, Next.js App Router, TypeScript, SQLite, fixture JSON, Pillow-generated fixture images, synthetic EXIF test images.

---

## Workflow Rules

- [ ] Use one issue, one branch or worktree, one agent/session.
- [ ] Keep write scopes explicit in every issue.
- [ ] Prefer draft PRs for agent-generated work.
- [ ] Require fresh verification evidence before marking any issue done.
- [ ] Require a handoff comment before pausing work.
- [ ] Treat Claude/Gemini frontend outputs as competing sketches unless the human owner selects one for integration.
- [ ] Keep MVP lightweight and YAGNI.

## GitHub Labels To Create

- `type:epic`
- `type:task`
- `type:design-exploration`
- `type:research`
- `type:docs`
- `lane:codex`
- `lane:claude`
- `lane:gemini`
- `lane:human`
- `slice:data-contracts`
- `slice:collection`
- `slice:creature-page`
- `slice:capture`
- `slice:privacy`
- `slice:ai`
- `slice:mystery`
- `slice:journal`
- `slice:public-site`
- `slice:devops`
- `risk:privacy-security`
- `risk:license-content`
- `risk:data-contract`
- `risk:visual-quality`
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `status:blocked`

## GitHub Project Fields

Create one MVP project with these fields:

- Status: Backlog, Ready, In Progress, Review, Blocked, Done.
- Priority: P0, P1, P2.
- MVP slice: Data Contracts, Collection, Creature Page, Capture, AI, Privacy, Journal, Public Site, DevOps.
- Agent lane: Codex, Claude, Gemini, Human.
- Worktree/branch: short text.
- Risk: privacy/security, license/content, visual quality, data contract, low.
- Verification: not started, local checks pass, screenshots captured, needs review.

## Issue Form Contract

Every MVP issue should include:

- Goal.
- Scope.
- Out of scope.
- Inputs.
- Acceptance criteria.
- Tests/verification.
- Agent lane.
- Work type.
- Risk.
- Dependencies.
- Handoff notes.

## Parent Issues And Sub-Issues

### Epic 1: Data Model And Fixture Loading

**Goal:** Make the fixture pack the first executable contract for DripDex entities, photos, observations, history, and card data.

**Labels:** `type:epic`, `priority:p0`, `slice:data-contracts`, `lane:codex`, `risk:data-contract`

#### Issue 1.1: Scaffold Next.js App Shell

**Goal:** Create the minimal Next.js/TypeScript app foundation that later issues can build on.

**Scope:** Project package setup, app router skeleton, base test tooling, lint/format scripts, basic landing route that renders without fixture data.

**Out of scope:** Production UI polish, auth, database writes, capture, AI integration.

**Inputs:** `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`, `AGENTS.md`.

**Acceptance criteria:**

- `package.json` has scripts for `dev`, `build`, `test`, `lint`, and `typecheck`.
- App router has a minimal public route.
- TypeScript config exists.
- Test runner exists and can run one smoke test.
- README or package scripts document how to start local dev.

**Verification:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 1.2: Define Fixture Domain Schemas

**Goal:** Convert fixture JSON shapes into typed, validated domain contracts.

**Scope:** TypeScript types and validation schemas for creatures, photos, observations, history, fixture manifest, statuses, categories, tags, rarity, and privacy flags.

**Out of scope:** Database schema, write APIs, UI rendering.

**Inputs:** `docs/fixtures/metadata`, `docs/fixtures/README.md`, `tests/fixtures/exif/README.md`.

**Acceptance criteria:**

- Types cover every existing fixture JSON file.
- Runtime validation reports useful errors for missing default photo references.
- Status values include Published, Draft, Hidden, Mystery, Needs Review.
- Tests load and validate all fixture metadata.

**Verification:** `npm test -- fixture`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 1.3: Build Fixture Repository Loader

**Goal:** Load fixture data through a repository boundary that can later be replaced by SQLite.

**Scope:** Read fixture JSON, resolve creature-photo-observation-history relationships, expose query functions for collection and creature pages.

**Out of scope:** SQLite, HTTP API, UI components.

**Inputs:** Issue 1.2 schemas, `docs/fixtures/metadata`.

**Acceptance criteria:**

- Loader returns all creatures.
- Loader resolves each creature default photo when required.
- Loader resolves all public image paths and verifies files exist.
- Loader can return a creature by ID and DripDex number.
- Tests prove public image paths do not point to synthetic EXIF fixtures.

**Verification:** `npm test -- fixture-repository`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

### Epic 2: Collection Index And Card Browsing

**Goal:** Build the fixture-backed collection index with search, grouping, card states, and tap routing.

**Labels:** `type:epic`, `priority:p0`, `slice:collection`, `lane:codex`, `risk:visual-quality`

#### Issue 2.1: Create Collection View Model

**Goal:** Transform repository data into card-ready collection groups.

**Scope:** View-model builder for card fields, grouped categories, progress counts, status treatments, favorite/new placeholders, and locked checklist placeholders.

**Out of scope:** React components, CSS polish, database-backed favorites.

**Inputs:** Collection Index Contract section in the spec, Issue 1.3 repository loader.

**Acceptance criteria:**

- Published, Mystery, Draft, Locked, New, and Favorite states are representable.
- Progress excludes Draft and Mystery entries.
- Unseeded confirmed species can increment found and total counts.
- Category groups are ordered as Birds, Mammals, Reptiles, Amphibians, Fish, Insects, Arachnids, Other Invertebrates, Plants, Fungi, Mysteries.

**Verification:** `npm test -- collection-view-model`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 2.2: Build Search And Filter Logic

**Goal:** Search and filter the collection using kid-friendly defaults and metadata-rich matching.

**Scope:** Pure search/filter functions for common name, scientific name, nickname, category, status, type tags, food-chain tags, seasonality, safety labels, and DripDex number.

**Out of scope:** Search UI, server search service, fuzzy ranking beyond simple useful matching.

**Inputs:** Issue 2.1 view model.

**Acceptance criteria:**

- Search matches all specified fields.
- Primary filters support All, Found, Favorites, Drafts, Mysteries.
- Secondary filters support category, rarity, safety label, seasonality, food-chain role, status, and type tag.
- Empty results return a kid-readable message.

**Verification:** `npm test -- collection-search`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 2.3: Implement Collection Card UI

**Goal:** Render mobile-first creature cards from the collection view model.

**Scope:** React card components, grouped category sections, favorites row, status treatments, mystery grayscale treatment, draft stamp, new badge, locked card icon, basic responsive layout.

**Out of scope:** Capture flow, creature detail page content, advanced animations.

**Inputs:** `/docs/mockups/collection-view-options.html`, `/docs/mockups/collection-view-favorites-groups.png`, Issues 2.1 and 2.2.

**Acceptance criteria:**

- Cards render from fixture data, not hardcoded sample text.
- Mystery cards use grayscale and question mark treatment.
- Draft cards show diagonal red draft stamp.
- Locked checklist cards use lock treatment.
- Favorites row appears only when favorites exist.
- Card text does not visibly overflow at mobile width.

**Verification:** `npm test -- collection-card`, `npm run build`, Playwright screenshot for mobile and desktop collection route.

**Agent lane:** Codex integration, with optional Claude/Gemini design review issues.

**Risk:** visual quality.

#### Issue 2.4: Frontend Exploration: Collection Card Polish With Claude

**Goal:** Let Claude propose a refined collection/card interaction treatment without owning integration.

**Scope:** One isolated design branch or mockup output using fixture cards, screenshots, rationale, and "what to steal" summary.

**Out of scope:** Merging code to main, changing backend/data contracts.

**Inputs:** Issue 2.3, collection mockups, fixture images.

**Acceptance criteria:**

- Provides mobile and desktop screenshots.
- Calls out accessibility and text-fit choices.
- Includes short integration notes.

**Verification:** Screenshot artifacts and human review.

**Agent lane:** Claude.

**Risk:** visual quality.

#### Issue 2.5: Frontend Exploration: Collection Card Polish With Gemini

**Goal:** Let Gemini propose a competing visual/interaction treatment using the same source material.

**Scope:** One isolated design branch or mockup output using fixture cards, screenshots, rationale, and "what to steal" summary.

**Out of scope:** Merging code to main, changing backend/data contracts.

**Inputs:** Issue 2.3, collection mockups, fixture images.

**Acceptance criteria:**

- Provides mobile and desktop screenshots.
- Critiques visual hierarchy and kid readability.
- Includes short integration notes.

**Verification:** Screenshot artifacts and human review.

**Agent lane:** Gemini.

**Risk:** visual quality.

### Epic 3: Creature Journal Page

**Goal:** Build the durable creature page that feels collectible for kids and useful as a journal for adults.

**Labels:** `type:epic`, `priority:p0`, `slice:creature-page`, `lane:codex`, `risk:visual-quality`

#### Issue 3.1: Create Creature Page View Model

**Goal:** Resolve one creature into page sections for photos, flavor text, facts, notes, observations, variants, and history.

**Scope:** Pure view-model builder from fixture repository data.

**Out of scope:** Editable notes persistence, live AI fact generation, full-screen image viewer.

**Inputs:** Creature Card Visual Decisions and Creature Journal sections in the spec.

**Acceptance criteria:**

- Page model includes default photo, carousel photos, display name, nickname, tags, rarity, flavor text, adult science, observations, and history.
- Mystery creature page model routes to mystery workspace instead of published journal.
- Missing optional sections are omitted cleanly.

**Verification:** `npm test -- creature-page-view-model`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 3.2: Implement Creature Journal UI

**Goal:** Render a creature journal page using the approved House Finch card direction.

**Scope:** Photo carousel, nickname display, kid flavor text, collapsed tag families, adult science accordion, notes placeholder, history accordion/table.

**Out of scope:** Full edit mode, real autosave, live citation generation.

**Inputs:** `/docs/mockups/tag-display-options.html`, `/docs/mockups/tag-display-options-full-page.png`, Issue 3.1.

**Acceptance criteria:**

- Page is mobile-first.
- Photo carousel shows dots and mid-image arrows when multiple photos exist.
- Adult science is collapsed by default.
- History table renders fixture events.
- Notes section is present as owner-only placeholder.

**Verification:** `npm test -- creature-journal`, `npm run build`, Playwright screenshots.

**Agent lane:** Codex integration, optional Claude/Gemini UI critique.

**Risk:** visual quality.

### Epic 4: EXIF, Image Processing, And Location Privacy

**Goal:** Prove DripDex can safely extract private location metadata while serving only public-safe derivatives.

**Labels:** `type:epic`, `priority:p0`, `slice:privacy`, `lane:codex`, `risk:privacy-security`

#### Issue 4.1: Implement EXIF Parser Tests And Utilities

**Goal:** Parse synthetic EXIF fixtures for GPS-present, GPS-absent, and partial-GPS cases.

**Scope:** EXIF parsing utility, typed result, tests using `tests/fixtures/exif`.

**Out of scope:** Upload UI, database persistence, public obfuscation.

**Inputs:** `tests/fixtures/exif/README.md`.

**Acceptance criteria:**

- Fake Austin GPS fixture parses to decimal coordinates.
- No-location fixture returns no coordinates without throwing.
- Partial-location fixture returns a recoverable error state.
- Tests never use real user/private photos.

**Verification:** `npm test -- exif`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** privacy/security.

#### Issue 4.2: Implement Public Derivative Image Processing

**Goal:** Create public-safe image derivatives that strip metadata and match DripDex image sizes.

**Scope:** Server-side utility or script for full, card, and thumbnail derivatives; metadata stripping tests.

**Out of scope:** Browser upload flow, cloud storage adapter.

**Inputs:** `docs/fixtures/source-images`, `docs/fixtures/web-images`, Issue 4.1.

**Acceptance criteria:**

- Full derivative max dimension is configurable.
- Card derivative supports current 20:21 card image ratio.
- Thumbnail derivative supports 1:1.
- Output derivatives contain no EXIF/GPS.

**Verification:** `npm test -- image-processing`, shell `file` check on generated outputs.

**Agent lane:** Codex.

**Risk:** privacy/security.

#### Issue 4.3: Implement Location Privacy Helpers

**Goal:** Convert exact private locations into public-safe location modes.

**Scope:** Privacy mode types, home-zone check, public region-only behavior, stored public-obscured point helper, tests with fake coordinates.

**Out of scope:** Map UI, owner preferences UI, database migrations.

**Inputs:** Location Storage, Public Location Display, Private Location Display sections in the spec.

**Acceptance criteria:**

- Exact private coordinates remain owner-only.
- Home-zone observations default to protected public output.
- Public obscured points are deterministic per observation seed, not regenerated per page load.
- Tests use fake coordinates only.

**Verification:** `npm test -- location-privacy`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** privacy/security.

### Epic 5: Capture And Draft Flow

**Goal:** Let the owner start a find, save a draft immediately, and progressively enrich it.

**Labels:** `type:epic`, `priority:p0`, `slice:capture`, `lane:codex`, `risk:privacy-security`

#### Issue 5.1: Design Draft State Machine

**Goal:** Define the recoverable draft lifecycle before wiring UI and AI.

**Scope:** Draft statuses, transitions, events, persistence interface, and tests.

**Out of scope:** Camera UI, Gemini integration, database implementation.

**Inputs:** Capture flow and Identify A Find sections in the spec.

**Acceptance criteria:**

- Draft can be created immediately after photo selection or manual observation start.
- Draft can record EXIF result, derivative result, subject tap, AI candidate, owner decision, and mystery save.
- Failed EXIF or AI processing does not hide the draft.
- Draft is searchable by Draft or Mystery status.

**Verification:** `npm test -- draft-state`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 5.2: Implement Capture Entry UI Stub

**Goal:** Provide the two-button capture entry point and shared preview target for upload/camera paths.

**Scope:** Upload photo button, open scanner button stub, shared preview shell, subject tap coordinates, target-lock animation placeholder.

**Out of scope:** Real browser camera polish, AI model integration, persistence beyond local stub.

**Inputs:** Capture Entry Point and Subject Targeting sections in the spec.

**Acceptance criteria:**

- Upload and scanner buttons converge into the same preview area.
- User tap records normalized x/y subject point.
- Status copy stays high-level and kid-readable.
- UI can show "Thank you for your help" then "Subject Located".

**Verification:** `npm test -- capture-entry`, Playwright screenshot/mobile interaction.

**Agent lane:** Codex integration, optional Gemini animation critique.

**Risk:** visual quality.

### Epic 6: Identification And AI Provider Adapter

**Goal:** Provide a safe adapter boundary for Gemini-first identification and future model/provider changes.

**Labels:** `type:epic`, `priority:p1`, `slice:ai`, `lane:codex`, `risk:privacy-security`

#### Issue 6.1: Define Identification Result Schema

**Goal:** Define the typed output DripDex expects from AI identification and normalization.

**Scope:** Candidate IDs, confidence, bounding boxes, reasoning, tags, safety labels, citations, and validation.

**Out of scope:** Live Gemini API calls, external chatbot prompt optimization.

**Inputs:** Identify A Find Journey and Mystery investigation schema examples in the spec.

**Acceptance criteria:**

- Schema supports multiple candidates.
- Bounding boxes use normalized coordinates.
- Validation rejects malformed software inputs.
- Tags and safety labels use existing tag families.

**Verification:** `npm test -- identification-schema`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 6.2: Implement AI Provider Interface And Mock Provider

**Goal:** Allow capture and mystery flows to use a mock provider before Gemini is wired.

**Scope:** Provider interface, mock result stream/events, typed event ordering for overlay progress.

**Out of scope:** Real API keys, billing, provider dashboards.

**Inputs:** Gemini-first model decision and progressive overlay notes in the spec.

**Acceptance criteria:**

- Mock provider emits target/candidate/data-ready style events.
- UI can consume validated events rather than half-formed streamed text.
- Provider interface can later wrap Gemini.

**Verification:** `npm test -- ai-provider`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** privacy/security.

### Epic 7: Mystery Investigation

**Goal:** Let the owner preserve uncertain finds, investigate later, and resolve them without losing history.

**Labels:** `type:epic`, `priority:p1`, `slice:mystery`, `lane:codex`, `risk:data-contract`

#### Issue 7.1: Implement Mystery Workspace View Model

**Goal:** Resolve mystery data into detail, external handoff, paste-normalize, and resolution views.

**Scope:** View model and actions for candidate history, notes, public/private state, download photo action metadata, and resolution CTAs.

**Out of scope:** Live AI normalization endpoint, public suggestion storage.

**Inputs:** Mystery Entries and Investigation section and `/docs/mockups/mystery-investigation-flow.html`.

**Acceptance criteria:**

- Mystery detail shows photo, known clues, candidate history, and actions.
- External LLM handoff uses EXIF-stripped analysis copy.
- Resolution CTAs are limited to log to existing entry, create duplicate, reject suggestion.
- Rejected suggestions are history events.

**Verification:** `npm test -- mystery-view-model`, `npm run typecheck`.

**Agent lane:** Codex.

**Risk:** data contract.

#### Issue 7.2: Implement Mystery Investigation UI

**Goal:** Render the mystery investigation flow from fixture-backed mystery data.

**Scope:** Mystery detail, copy prompt, download photo, paste response, normalize placeholder, resolve candidate view.

**Out of scope:** Production prompt optimization, live external LLM integration.

**Inputs:** `/docs/mockups/mystery-investigation-flow.html`, Issue 7.1.

**Acceptance criteria:**

- Mystery image can be shown in full color in detail view.
- Copy prompt makes clear that the external LLM should inspect the photo.
- Paste Resolution field accepts text.
- Normalize step is visibly an owner-reviewed candidate, not an authority.

**Verification:** `npm test -- mystery-ui`, Playwright screenshots.

**Agent lane:** Codex integration, optional Claude copy review.

**Risk:** visual quality.

### Epic 8: Private Journal Dashboard And Map

**Goal:** Give the owner a private work queue, map/heatmap, history, and preferences dashboard.

**Labels:** `type:epic`, `priority:p1`, `slice:journal`, `lane:codex`, `risk:privacy-security`

#### Issue 8.1: Implement Private Journal Queue

**Goal:** Show drafts, mysteries, review needs, and recent field activity in the owner dashboard.

**Scope:** Queue view model and UI tab using fixture/stub data.

**Out of scope:** Auth enforcement, live database writes.

**Inputs:** Private Journal Dashboard section and `/docs/mockups/private-journal-dashboard.html`.

**Acceptance criteria:**

- Queue shows drafts and mysteries.
- Pending review states are visible.
- Public/private preview distinction is clear.

**Verification:** `npm test -- journal-queue`, Playwright screenshot.

**Agent lane:** Codex.

**Risk:** privacy/security.

#### Issue 8.2: Implement Private Map Adapter Stub

**Goal:** Prepare the private map/heatmap boundary without overbuilding maps before data exists.

**Scope:** Map adapter interface, fake private observation points, Leaflet/Leaflet.heat integration or stub if map dependency is delayed.

**Out of scope:** Public map, production tile hosting, native maps.

**Inputs:** Map Direction and Private Location Display sections in the spec.

**Acceptance criteria:**

- Exact points are owner-only.
- Heatmap data uses private fake coordinates in tests.
- Tile URL is configurable.

**Verification:** `npm test -- private-map`, screenshot if map UI is implemented.

**Agent lane:** Codex.

**Risk:** privacy/security.

### Epic 9: Public Intro, Guestbook, And Publishing Controls

**Goal:** Make the public DripDex browsable and welcoming while keeping owner moderation in control.

**Labels:** `type:epic`, `priority:p2`, `slice:public-site`, `lane:codex`, `risk:privacy-security`

#### Issue 9.1: Implement Public Intro And Cookie Dismissal

**Goal:** Show the project intro once and let visitors hide it.

**Scope:** Intro panel, Hide Intro CTA, learn-more link placeholder, cookie/local storage dismissal.

**Out of scope:** Full GitHub Pages site.

**Inputs:** Public intro behavior in the spec.

**Acceptance criteria:**

- Hide Intro is primary CTA.
- Learn More is secondary CTA.
- Dismissed intro stays hidden on reload.

**Verification:** `npm test -- public-intro`, Playwright reload test.

**Agent lane:** Codex.

**Risk:** low.

#### Issue 9.2: Implement Guestbook Moderation Stub

**Goal:** Let visitors submit a guestbook note that appears pending until owner approval.

**Scope:** Guestbook accordion, fields, pending submission state, approved entry list with pagination boundary.

**Out of scope:** Real spam prevention, email notifications, persistent moderation database.

**Inputs:** Guestbook behavior in the spec and collection mockup screenshots.

**Acceptance criteria:**

- Accordion defaults closed.
- Whole closed accordion is clickable.
- Submit shows pending row immediately.
- Approved entries paginate after 50.

**Verification:** `npm test -- guestbook`, Playwright interaction test.

**Agent lane:** Codex.

**Risk:** privacy/security.

### Epic 10: OSS Deployment And Project Docs

**Goal:** Make DripDex understandable and deployable for a parent, teacher, or local nature club.

**Labels:** `type:epic`, `priority:p2`, `slice:devops`, `lane:codex`, `risk:license-content`

#### Issue 10.1: Create GitHub Pages Product Docs Plan

**Goal:** Document the future GitHub Pages branch/site that explains DripDex and self-hosting.

**Scope:** Docs outline, content inventory, screenshots to include, deployment approach.

**Out of scope:** Full docs site build if app MVP is not scaffolded yet.

**Inputs:** Project Documentation Site section in the spec.

**Acceptance criteria:**

- Docs outline explains what DripDex is.
- Includes self-host path for OSS users.
- Includes source/license fixture validation note.
- Links back to repo and public app.

**Verification:** Markdown review.

**Agent lane:** Codex.

**Risk:** license/content.

#### Issue 10.2: Create OSS Environment And Deployment Checklist

**Goal:** Capture the low-infrastructure OSS deployment path before implementation assumptions drift.

**Scope:** Environment variables, SQLite persistence notes, image storage assumptions, Vercel free-tier caveats, local dev commands.

**Out of scope:** Production SaaS billing and Supabase multi-user setup.

**Inputs:** Tech Stack and OSS/SaaS boundary sections in the spec.

**Acceptance criteria:**

- Checklist distinguishes OSS single-owner from future SaaS.
- SQLite and file/image storage assumptions are explicit.
- Required secrets are documented without example real secrets.

**Verification:** Markdown review.

**Agent lane:** Codex.

**Risk:** privacy/security.

## GitHub Artifact Creation Order

- [x] Create labels.
- [x] Create parent epic issues.
- [x] Create child issues.
- [x] Link child issues from parent issue bodies when sub-issue API is unavailable.
- [x] Create issue forms under `.github/ISSUE_TEMPLATE`.
- [x] Create a lightweight project setup note because GitHub Project automation requires the GitHub CLI `project` scope.
- [x] Commit issue form files.
- [x] Push documentation and issue template changes.
- [x] Create local GitHub issue index at `docs/github-issues-index.md`.

## Notes For GitHub Creation

- If GitHub sub-issues are unavailable through CLI/API, link children in parent issue bodies and add `Parent:` links to child issue bodies.
- If GitHub Projects creation requires browser/manual setup, create a `docs/github-project-setup.md` fallback with exact fields.
- Do not create implementation branches until the issue hierarchy exists.
- Do not assign Claude/Gemini work until their design exploration issue bodies are ready and scoped.

## Created GitHub Artifacts

- Labels: all labels listed in this plan were created, plus `risk:low`.
- Parent epics: `#1` through `#10`.
- Child task/design issues: `#11` through `#35`.
- Issue forms: `.github/ISSUE_TEMPLATE/mvp-epic.yml` and `.github/ISSUE_TEMPLATE/mvp-task.yml`.
- Project setup fallback: `docs/github-project-setup.md`.
- Issue index fallback: `docs/github-issues-index.md`.

GitHub Project creation was not automated in this pass because `gh project` requires the `project` token scope. To enable it later, run `gh auth refresh -s project`, then use `docs/github-project-setup.md` as the field/view checklist.
