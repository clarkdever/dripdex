# GitHub Pages Preview Outline

Date: 2026-06-30
Status: Draft for owner review before Pages branch build
Issue: #63

## Review Gate

No `gh-pages` branch, GitHub Pages workflow, generated static site, or public Pages deployment should be created until this outline is reviewed and approved.

## Site Goals

The GitHub Pages preview should explain DripDex to people who are not reading the codebase: parents, teachers, local clubs, open-source users, and future contributors. It should show what the MVP is trying to become, make the privacy model visible, and point people toward a safe fixture-backed preview path without implying that real private hosting is ready.

The first Pages site should stay static and small. It should reuse existing screenshots, fixture-source notes, and plans instead of introducing a documentation framework.

## Proposed Pages

- `index.html`: product overview, audience, current MVP status, screenshots, and links to the repository and public preview.
- `build-your-own.html`: plain-language clone/local preview/Vercel Hobby preview path, with a clear warning that durable private hosting is not implemented yet.
- `privacy-and-safety.html`: public/private data boundary, EXIF-stripped derivatives, exact GPS rules, home-zone rules, guestbook moderation expectations, and field-safety language.
- `fixture-sources.html`: fixture image/source/license notes, validation status, attribution expectations, and links to `docs/fixtures/README.md`.

## Home Page Outline

Primary message: DripDex is a mobile-first Texas Hill Country field guide and personal nature journal for families, classrooms, clubs, and curious local naturalists.

Content blocks:

- Short definition and audience statement.
- Current MVP status: fixture-backed public preview with creature cards, creature pages, capture stub, mystery workflow, journal preview, public intro, and guestbook moderation states.
- Privacy-first promise: public visitors see safe derivatives and generalized public data; exact GPS and private originals are owner-only in the intended product.
- Screenshot strip using public collection and guestbook mockups.
- Calls to action:
  - View repository.
  - Open public preview when available.
  - Build your own preview.
  - Read privacy and fixture-source notes.

## Build Your Own Page Outline

Primary message: a non-coder can use the README or an agent to make a public fixture-backed preview on Vercel Hobby.

Content blocks:

- What this path is for: public preview, family/classroom evaluation, contributor demo, or local club proof of concept.
- What this path is not for yet: real private uploads, exact GPS storage, SQLite persistence, private original archival, or durable image storage.
- Account checklist:
  - GitHub account.
  - Vercel account through `https://vercel.com/signup`.
  - No affiliate link or tracking parameters.
- Local command summary:
  - `git clone https://github.com/clarkdever/dripdex.git`
  - `cd dripdex`
  - `npm install`
  - `npm run dev`
- Verification summary:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm audit --audit-level=moderate`
- Agent-assisted deploy summary: point to the README prompt instead of duplicating it in full.

## Privacy And Safety Page Outline

Primary message: DripDex should be fun for kids without leaking family/classroom location data.

Content blocks:

- Public images must be EXIF-stripped derivatives.
- Private originals are owner-only and must not be published.
- Exact GPS is owner-only.
- Public location should be generalized or obscured.
- Home-zone and sensitive-species observations require stricter public generalization.
- Guestbook submissions require owner review before public visibility in any persistent implementation.
- AI suggestions require owner review before publishing.
- Field safety language:
  - Look closely, but do not handle unknown organisms.
  - Safety notes are educational prompts, not medical or wildlife-handling advice.
  - Avoid kid-facing edible or medicinal tags in the MVP.

## Fixture Sources Page Outline

Primary message: sample images and creature data are development fixtures and need visible attribution and validation status.

Content blocks:

- Link to `docs/fixtures/README.md` as the canonical fixture source table.
- Explain that sample fixture records currently keep `needsHumanValidation: true`.
- Explain source page, credit, license, and access notes must be reviewed before treating sample content as canonical.
- State that public web derivatives under `docs/fixtures/web-images/` are re-saved and should be EXIF-stripped.
- State that synthetic EXIF files under `tests/fixtures/exif/` are test-only and must never be published as public sample assets.
- Include or link a fixture table with:
  - Fixture number.
  - Common name.
  - Scientific name.
  - Source page.
  - License name and link.
  - Credit.
  - Validation status.
  - Modification note.

## Screenshot Inventory

Use optimized screenshots only. Do not include private originals, synthetic EXIF test images, exact GPS screenshots, or unreviewed upload examples.

| Source | Caption | Status Label | Privacy Note |
|---|---|---|---|
| `docs/mockups/collection-view-public-default.png` | Public collection with creature cards and fixture-backed browsing. | Implemented preview | Public-safe fixture content only. |
| `docs/mockups/collection-view-intro-hidden.png` | Public collection after intro dismissal. | Implemented preview | Cookie-style dismissal should not store sensitive data. |
| `docs/mockups/collection-view-guestbook-open.png` | Guestbook form open for visitor note entry. | Implemented preview | Persistent guestbook requires moderation before public display. |
| `docs/mockups/collection-view-guestbook-pending.png` | Guestbook submission shown as pending owner approval. | Implemented preview | Visitor content should not publish directly. |
| `docs/mockups/collection-view-favorites-groups.png` | Collection grouping and favorites-style browsing concept. | Implemented preview | Public collection view only. |
| `docs/mockups/mystery-investigation-flow-all-views.png` | Mystery investigation workflow across prompt, paste, normalize, and resolve states. | Implemented preview | Avoid exact GPS in copied prompts by default. |
| `docs/mockups/private-journal-dashboard-all-tabs.png` | Private journal dashboard tabs for queue, map, history, and preferences. | Mockup/preview | Owner-only concept; do not expose exact map data publicly. |

## Links And Calls To Action

Required links:

- Repository: `https://github.com/clarkdever/dripdex`
- Vercel signup: `https://vercel.com/signup`
- Product design: `docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md`
- GitHub Pages product docs plan: `docs/superpowers/plans/2026-06-30-github-pages-product-docs-plan.md`
- OSS deployment checklist: `docs/superpowers/plans/2026-06-30-oss-environment-deployment-checklist.md`
- Fixture source notes: `docs/fixtures/README.md`

Conditional links:

- Public Vercel preview URL: include only after a preview exists.
- GitHub Pages URL: include only after the Pages site is approved, built, and published.

## Non-Goals For First Pages Build

- No analytics, tracking scripts, newsletter forms, or comment widgets.
- No affiliate links.
- No private originals, exact GPS data, owner emails, API keys, or synthetic EXIF test images.
- No full docs framework until static pages are too limiting.
- No `gh-pages` branch, Pages workflow, generated site, or Pages deployment before this outline is approved.
- No claims that Vercel Hobby is complete production hosting for real private observations.
- No managed SaaS setup, billing, classrooms, or multi-user auth.

## Open Review Questions

1. Should the first Pages site link to a live Vercel preview immediately after one exists, or should it wait until fixture source validation is reviewed?
2. Should the private journal dashboard screenshot appear on the home page, or only on the privacy/safety page because it represents owner-only behavior?
3. Should the Pages site include the full fixture table in static HTML, or link to `docs/fixtures/README.md` until the source validation pass is complete?
4. Should the first Pages build be handwritten static HTML on `gh-pages`, or generated from a small source directory in `main` after this outline is approved?
