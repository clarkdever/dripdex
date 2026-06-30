# DripDex

DripDex is a mobile-first Texas Hill Country field guide and personal nature journal. It is inspired by creature-collection games, but the goal is real local discovery: kids, families, teachers, clubs, and curious naturalists can browse local organisms, record observations, and learn from cited naturalist sources.

## What Works Today

This repository currently contains a fixture-backed MVP preview. That means the app can show sample creature cards, creature pages, a capture-flow stub, mystery investigation screens, a private journal preview gate, public intro behavior, and guestbook moderation states using checked-in sample data.

The current app is useful for previewing the product direction. It is not yet ready for real family/classroom uploads, private original photos, exact GPS storage, SQLite writes, or durable image storage on a hosting provider.

## Before You Start

You need:

- A computer where you can install developer tools.
- A GitHub account if you want to copy or deploy the project.
- A Vercel account if you want a public hosted preview: [Sign up for Vercel](https://vercel.com/signup).
- Node.js `>=22.13 <23`.
- npm, which comes with Node.js.

If you have never installed Node.js before, use the current Node 22 release from the official Node.js site or a trusted version manager. The app is tested against Node 22, and newer major versions may behave differently.

## Try It On Your Computer

Open a terminal and run:

```bash
git clone https://github.com/clarkdever/dripdex.git
cd dripdex
npm install
npm run dev
```

When the dev server starts, open the local URL it prints, usually:

```text
http://localhost:3000
```

To preview the private journal route locally, start the dev server with the owner preview flag:

```bash
DRIPDEX_OWNER_JOURNAL_PREVIEW=enabled npm run dev
```

Then open:

```text
http://localhost:3000/journal
```

The private journal route is still a preview stub. Do not use it for real private observations yet.

## Deploy A Public Preview On Vercel Hobby

Vercel Hobby is a reasonable way to publish a public, fixture-backed preview of DripDex from your own GitHub copy.

This is a good path for a public, fixture-backed preview of DripDex. It is not yet the full private family/classroom hosting story for real uploads, private originals, SQLite writes, exact GPS, or durable image storage.

High-level steps:

1. Create or sign into GitHub.
2. Create or sign into Vercel: [Sign up for Vercel](https://vercel.com/signup).
3. Copy or fork this repository into your GitHub account.
4. In Vercel, import the GitHub repository as a new project.
5. Let Vercel detect the Next.js app settings.
6. Deploy the project.
7. Open the Vercel URL and confirm the public collection page loads.

Do not enable real uploads or store private observations on this deployment until DripDex has durable auth, database, and storage adapters configured for your host.

## Copy-Paste Prompt For An Agent

If you use an AI coding agent, you can paste this prompt into it:

```text
You are helping me deploy DripDex from GitHub to my Vercel Hobby account.

Before doing anything destructive, explain what you plan to do and ask for confirmation.

First, make sure I have or create these accounts:
- GitHub account
- Vercel account at https://vercel.com/signup

Then inspect my machine or agent environment and check whether these tools exist:
- git
- Node.js and npm, with Node.js >=22.13 and <23
- GitHub CLI (`gh`)
- Vercel CLI (`vercel`)

If `gh` or `vercel` is missing, ask my permission before installing it. If this agent environment supports MCP servers, plugins, or connectors, check whether GitHub and Vercel connectors are available. If either connector is absent and would help with this deployment, request installation instead of assuming it exists.

Authenticate only through official interactive login flows:
- Run `gh auth status`. If GitHub is not logged in, ask me to complete `gh auth login`.
- Run `vercel whoami`. If Vercel is not logged in, ask me to complete `vercel login`.

Do not ask me to paste secrets, tokens, API keys, or passwords into chat.

Clone the public repository:

git clone https://github.com/clarkdever/dripdex.git
cd dripdex

Install and verify locally:

npm install
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate

If those checks pass, deploy a public preview to Vercel. Use Vercel's normal project linking/import flow for my account. Tell me the deployed URL when it succeeds.

Important privacy warning: this DripDex deployment is currently only a fixture-backed public preview. Do not upload real private family/classroom observations, private original photos, exact GPS data, or secrets. Real private hosting requires durable auth, database, and storage adapters that are not part of this quick preview path yet.
```

## Important Privacy Notes

DripDex is designed around a strict privacy boundary:

- Public images should be EXIF-stripped derivatives.
- Private originals may contain sensitive context and should stay owner-only.
- Exact GPS coordinates should never appear in public routes.
- Home-zone and sensitive-species observations need stricter public generalization.
- Guestbook or visitor submissions should require owner approval before becoming public in any persistent implementation.

The checked-in fixture images and metadata are sample content for development and preview. They are not a promise that source terms, species identity, or scientific facts have been fully human-validated.

## Developer Checks

Before opening a pull request or trusting a deployment, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

## Deeper Project Docs

- Product design: [docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md](docs/superpowers/specs/2026-06-27-texas-hill-country-dripdex-design.md)
- GitHub Pages docs plan: [docs/superpowers/plans/2026-06-30-github-pages-product-docs-plan.md](docs/superpowers/plans/2026-06-30-github-pages-product-docs-plan.md)
- OSS deployment checklist: [docs/superpowers/plans/2026-06-30-oss-environment-deployment-checklist.md](docs/superpowers/plans/2026-06-30-oss-environment-deployment-checklist.md)
- Fixture source notes: [docs/fixtures/README.md](docs/fixtures/README.md)
