# GitHub Pages Product Docs Plan

Date: 2026-06-30
Status: Plan for future docs-site implementation
Issue: #34 Task: Create GitHub Pages Product Docs Plan

## Goal

Create a small GitHub Pages documentation site that explains what DripDex is, shows the current MVP direction, and gives parents, teachers, and local nature clubs a practical path to self-host a single-owner field journal.

This issue plans the site. It does not build the `gh-pages` branch or publish GitHub Pages.

## Audience

- Parents who want a playful nature journal for their family.
- Teachers and clubs who want a local field-guide project.
- Open-source users who want to self-host without buying a managed service.
- Future contributors who need to understand the privacy and licensing boundaries before adding content or integrations.

## Required Links

The published docs site should include these links in the header or footer:

- Repository: <https://github.com/clarkdever/dripdex>
- Public app: use the deployed public DripDex URL once available. Until deployment exists, render `Public app: coming soon` as plain text, not a misleading link.
- Local MVP preview path for contributors: `/` from `npm run dev`.
- Product spec source: `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`
- Fixture image validation table: `docs/fixtures/README.md`

## Site Shape

Keep the first site static and lightweight. A simple GitHub Pages branch with generated static HTML is enough; avoid adding a full documentation framework until the content outgrows a few pages.

Recommended first structure:

```text
/
  index.html
  build-your-own.html
  privacy-and-safety.html
  fixture-sources.html
  screenshots/
```

If the team later wants richer navigation, search, or versioning, migrate the same content into a docs framework in a separate issue.

## Page Outline

### Home: What Is DripDex?

Purpose: explain the product in one screen, using the public collection as the anchor.

Content:

- One-sentence definition: DripDex is a mobile-first Texas Hill Country field guide and personal nature journal.
- Short audience statement: built for families, classrooms, clubs, and curious local naturalists.
- MVP shape:
  - Public visitors browse creature cards.
  - The owner captures observations, identifies finds, and controls what becomes public.
  - Exact location and original image metadata stay private.
- Screenshot: public collection default state.
- Links:
  - Repository.
  - Public app when deployed.
  - Build your own DripDex page.

### Build Your Own DripDex

Purpose: give open-source users a plain-language path from clone to local preview, then point to the deeper deployment checklist.

Content:

- Who this is for: single owner, family, teacher, club, or local nature project.
- Local setup:
  - `npm install`
  - `npm run dev`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- Self-host path overview:
  1. Clone the repository and install dependencies.
  2. Run the app locally and confirm the public collection renders.
  3. Configure owner auth, secrets, AI/search provider choices, and storage roots before uploading real observations.
  4. Choose a supported host for the web app and persistent storage. The first OSS target should stay single-owner and low-infrastructure.
  5. Run production build/start commands for the chosen host.
  6. Back up SQLite data and private/public image storage on a schedule.
  7. Re-run verification after dependency, fixture, storage, or hosting changes.
- Expected MVP defaults:
  - Next.js public web app.
  - SQLite-first direction for the open-source edition.
  - Local or configurable storage for private originals and public derivatives.
  - Bring-your-own AI key or AI disabled.
  - Bring-your-own search provider or comparison images disabled.
- Link to the future OSS deployment checklist from #35 when available.
- Note that managed SaaS, billing, multi-user classrooms, and Supabase production setup are future work, not required for the first self-hosted path.

### Privacy And Safety

Purpose: make the privacy model clear before anyone uploads real family or classroom observations.

Content:

- Public web images must be EXIF-stripped derivatives.
- Private originals may be retained only for owner-only review and reprocessing.
- Exact GPS coordinates are owner-only.
- Public location should use generalized or obscured output, not raw GPS.
- Home-zone observations require stronger public generalization.
- Sensitive species, nests, dens, roosts, burrows, and home-zone observations should not be downgraded below the required privacy rule.
- Kids and field safety:
  - Look first, do not handle unknown organisms.
  - Avoid public kid-facing edible or medicinal tags in MVP.
  - Safety notes are educational prompts, not medical or wildlife-handling advice.

### Fixture Sources And Licenses

Purpose: make source validation and attribution visible so the open-source sample content does not become a mystery pile.

Content:

- Link to `docs/fixtures/README.md`.
- Explain that the fixture pack uses public or clearly reusable source-linked images where possible.
- Explain that every fixture is currently marked `needsHumanValidation: true`.
- Explain that source pages, author credits, licenses, and access notes must be reviewed before treating sample species identity or source terms as canonical.
- State that stored source-image copies and public web derivatives are re-saved without EXIF metadata.
- State that synthetic EXIF fixtures with fake coordinates live under `tests/fixtures/exif/` and must not be mixed with public fixture assets.
- Generate the docs table from fixture metadata when practical. If the first docs build copies from `docs/fixtures/README.md`, treat that table as the canonical source and update both files in the same PR when attribution changes.
- Include these table fields:
  - Fixture number.
  - Common name.
  - Scientific name.
  - Source page.
  - License name and link when available.
  - Credit.
  - Validation status.
  - Modification note, for example `resized, cropped, re-saved, EXIF stripped`.

### Screenshots And Mockups

Purpose: show the intended MVP without requiring visitors to read the whole product spec.

Include these approved screenshots first:

- `docs/mockups/collection-view-public-default.png`
- `docs/mockups/collection-view-intro-hidden.png`
- `docs/mockups/collection-view-guestbook-open.png`
- `docs/mockups/collection-view-guestbook-pending.png`
- `docs/mockups/collection-view-favorites-groups.png`
- `docs/mockups/mystery-investigation-flow-all-views.png`
- `docs/mockups/private-journal-dashboard-all-tabs.png`

Each screenshot should include:

- Short caption.
- Current implementation status: `implemented`, `planned`, or `mockup only`.
- Privacy note when the screenshot shows private journal, map, owner queue, or exact-location concepts.

## Content Inventory

Reuse or link these existing repo sources rather than duplicating long sections:

- Product north star and OSS/SaaS boundary:
  `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`
- MVP issue map:
  `docs/github-issues-index.md`
- GitHub Project setup:
  `docs/github-project-setup.md`
- Fixture source table and processing notes:
  `docs/fixtures/README.md`
- Open fixture image pack implementation notes:
  `docs/superpowers/plans/2026-06-29-open-fixture-image-pack.md`
- Local development commands:
  `README.md`

## Deployment Approach

Recommended first implementation:

1. Create a separate docs-publishing issue after #34.
2. Build static files from a small docs source directory or handwritten HTML.
3. Publish through GitHub Pages from `gh-pages` or a `/docs` publishing directory, whichever best matches repository settings at implementation time.
4. Keep large source images out of the docs site; use optimized screenshots and public fixture web derivatives only.
5. Add links from:
   - Public intro `Learn More` CTA.
   - Repository `README.md`.
   - Future OSS deployment checklist.

Do not add analytics, external tracking, comment widgets, newsletter forms, or hosted backend dependencies to the first docs site.

## Source And License Gate

Before publishing fixture screenshots or sample creature content on the docs site:

- Verify every fixture image shown has a source page, license, and credit in `docs/fixtures/README.md`.
- Keep `needsHumanValidation: true` visible for sample data until the owner reviews species identity and source terms.
- Do not imply the fixture species list is scientifically complete or human-validated.
- Do not publish private originals, exact GPS, synthetic EXIF test images, or user-upload examples.
- Prefer public derivatives from `docs/fixtures/web-images/`.
- Include attribution near fixture-heavy screenshots or on the Fixture Sources page.

## Acceptance Checklist

- [x] Docs outline explains what DripDex is.
- [x] Includes a self-host path for OSS users.
- [x] Includes source/license fixture validation notes.
- [x] Specifies links back to the repo and public app.
- [x] Lists screenshots to include.
- [x] Defines a lightweight GitHub Pages deployment approach.
