# Open Fixture Image Pack Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development when implementing future automation from this plan. This file is also the live tracker for the first open fixture pack.

**Goal:** Build a small, license-safe DripDex fixture pack with source links, web-safe image derivatives, and schema-aligned metadata for cards, photos, observations, and history logs.

**Architecture:** Use public, source-linked images for OSS fixtures. Keep stored fixture images EXIF-stripped for the public repo, and keep metadata in JSON files so the first app implementation can wire cards and detail pages without inventing contracts later. Use separate synthetic EXIF fixtures with fake coordinates for TDD of privacy behavior.

**Tech Stack:** Public web search, Wikimedia Commons/public-domain-friendly image sources when possible, local image processing, JSON fixtures.

---

## Directory Contract

- `docs/fixtures/source-images/`: stored source-image copies for fixture processing; these are re-saved without EXIF before commit.
- `docs/fixtures/web-images/`: EXIF-stripped resized derivatives used by mockups and app fixtures.
- `docs/fixtures/metadata/creatures/`: one JSON file per creature/entity.
- `docs/fixtures/metadata/photos/`: one JSON file per photo derivative.
- `docs/fixtures/metadata/observations/`: one JSON file per observation.
- `docs/fixtures/metadata/history/`: one JSON file per creature activity log.
- `tests/fixtures/exif/`: synthetic EXIF fixtures with fake coordinates used only for parser/privacy tests.

## Fixture Scope

- [x] Bird: found
- [x] Bird: source page recorded
- [x] Bird: image processed
- [x] Bird: metadata created
- [x] Insect: found
- [x] Insect: source page recorded
- [x] Insect: image processed
- [x] Insect: metadata created
- [x] Arachnid: found
- [x] Arachnid: source page recorded
- [x] Arachnid: image processed
- [x] Arachnid: metadata created
- [x] Amphibian: found
- [x] Amphibian: source page recorded
- [x] Amphibian: image processed
- [x] Amphibian: metadata created
- [x] Reptile: found
- [x] Reptile: source page recorded
- [x] Reptile: image processed
- [x] Reptile: metadata created
- [x] Mammal: found
- [x] Mammal: source page recorded
- [x] Mammal: image processed
- [x] Mammal: metadata created
- [x] Flowering plant: found
- [x] Flowering plant: source page recorded
- [x] Flowering plant: image processed
- [x] Flowering plant: metadata created
- [x] Cactus/succulent: found
- [x] Cactus/succulent: source page recorded
- [x] Cactus/succulent: image processed
- [x] Cactus/succulent: metadata created
- [x] Fungus/lichen: found
- [x] Fungus/lichen: source page recorded
- [x] Fungus/lichen: image processed
- [x] Fungus/lichen: metadata created
- [x] Other invertebrate: found
- [x] Other invertebrate: source page recorded
- [x] Other invertebrate: image processed
- [x] Other invertebrate: metadata created
- [x] Aquatic/pond life: found
- [x] Aquatic/pond life: source page recorded
- [x] Aquatic/pond life: image processed
- [x] Aquatic/pond life: metadata created
- [x] Mystery/unknown: found
- [x] Mystery/unknown: source page recorded
- [x] Mystery/unknown: image processed
- [x] Mystery/unknown: metadata created

## Source Rules

- [x] Prefer Wikimedia Commons, government, university extension, or other sources with clear reuse terms.
- [x] Record the source HTML page, direct image URL, license, author/credit, and access date.
- [x] Do not rely on an image URL alone; humans need the page link for validation.
- [x] If the source identity is questionable, store the fixture as `mystery` or choose another source.

## Processing Rules

- [x] Create a full web derivative with max dimension around 1600 px.
- [x] Create a card crop derivative matching the visual card ratio where reasonable.
- [x] Create a thumbnail derivative around 512 px.
- [x] Strip metadata from every web derivative.
- [x] Strip metadata from every stored public source-image copy.
- [x] Record dimensions and processing status in photo metadata.
- [x] Keep real user/private/original EXIF out of the OSS repo.

## EXIF TDD Rules

- [x] Create synthetic test images with fake GPS coordinates, not real public-source or user coordinates.
- [x] Keep EXIF test fixtures under `tests/fixtures/exif/`, not public fixture directories.
- [x] Cover GPS present, GPS absent, and malformed/partial EXIF cases.
- [ ] Use EXIF fixtures to test exact-private storage, public derivative stripping, public obfuscation, and graceful fallback.

## Metadata Rules

- [x] Creature metadata includes display names, category, Pokemon-style type tags, food-chain tags, seasonality, safety labels, rarity, status, default photo ID, and source citations.
- [x] Photo metadata includes source file, derivative paths, source attribution, dimensions, EXIF-stripped status, and subject crop/point placeholder fields.
- [x] Observation metadata includes public-safe location text, exact GPS omitted for OSS fixture data, capture method, notes, and status.
- [x] History metadata includes first found and photo-added events.

## Human Validation

- [x] Provide a source-link table in `docs/fixtures/README.md`.
- [x] Mark every fixture as `needsHumanValidation: true` until the user reviews the source page and photo.
- [x] Keep external image identity confidence separate from future app AI confidence.

## Current Outcome

- Created 12 public fixture records.
- Created 12 stored source-image copies, 36 web derivatives, 12 creature records, 12 photo records, 12 observation records, and 12 history logs.
- Created 3 synthetic EXIF test images for future TDD.
- Verified JSON parses successfully.
- Verified public fixture images under `docs/fixtures/source-images/` and `docs/fixtures/web-images/` do not report EXIF/GPS via `file`.
- Verified synthetic EXIF test fixtures report EXIF, including GPS-present and partial-GPS cases.
