# Texas Hill Country DripDex Design

Date: 2026-06-27
Status: Draft for discussion
Project path: `/Users/clarkdever/Documents/code/pokedex`

## 1. Product North Star

Build a mobile-first, web-based DripDex field guide for the Texas Hill Country that turns local nature observation into a playful, educational discovery experience.

The app should feel fun enough for a six-year-old to explore, while still being scientifically useful for adults. It should encourage kids and families to get outdoors, notice local organisms, learn about ecosystems, and build curiosity through creature cards, scan-style pages, type tags, rarity, variants, mystery entries, and cited facts.

The first version is a personal field journal owned by one person. Anyone can view the public DripDex, but only the owner can log in to add, edit, identify, and manage observations.

## 2. Core Product Decisions

### MVP Product Shape

Approach 1, "Local Field Journal First," is the chosen direction.

The MVP prioritizes the owner's observation workflow:

- Upload a photo.
- Extract private EXIF/GPS data when available.
- Strip EXIF from any image shown on the web.
- Use AI to suggest an identification with confidence.
- Let the owner accept, refine, disagree, or enter an ID manually.
- Create or update a DripDex entry.
- Publicly display fun, kid-friendly creature pages with cited science available in expandable sections.
- Privately display exact coordinates, full observation details, and heatmaps.

This approach gives the open-source edition a useful standalone identity and creates a clean foundation for a later paid managed version.

### Target Audience

The public experience should be accessible to young children and educational for adults.

Design implications:

- Primary surfaces use photos, icons, simple text, type tags, and playful visual framing.
- Deeper scientific material appears in expandable sections.
- Safety guidance is clear and age-appropriate.
- The app avoids overwhelming first-time visitors with taxonomy-heavy screens.

### Organism Scope

The architecture should support all organism groups from the start, including mammals, amphibians, insects, arachnids, birds, flowers, and other plants.

The UI should not require a fixed set of categories before real data exists. Categories appear organically as observations and entries are added.

### Public and Private Access

Anyone can view public data.

Only the owner can:

- Upload photos.
- Add observations.
- Add no-photo observations.
- Approve AI identifications.
- Edit creature entries.
- See exact GPS coordinates.
- See the private heatmap.
- See private originals and full EXIF data.

## 3. Open Source and Paid SaaS Boundary

The product should be designed as open-source core plus deploy profiles plus a paid managed service.

### Open Source Edition

The open-source edition is a single-owner field journal with public browsing.

Expected open-source characteristics:

- Self-hostable.
- Low infrastructure commitment.
- Suitable for a parent, teacher, nature club, or local science project.
- Public DripDex browsing.
- Owner-only login for adding/editing.
- Bring-your-own AI key or AI disabled.
- Bring-your-own search provider or comparison images disabled.
- Configurable storage provider.
- Configurable auth provider.
- Standard Postgres/PostGIS-compatible data model.

### Managed SaaS Edition

The paid edition provides convenience and collaboration.

Likely paid features:

- Hosted infrastructure.
- Managed backups.
- Managed AI pipeline and usage controls.
- Multi-user journals.
- Classroom or family groups.
- Contributor roles.
- Moderation/review workflows.
- Easier onboarding.
- Optional billing and organization management.

### Architectural Boundary

Supabase should be an adapter, not the skeleton of the app.

Proposed package/service boundaries:

- `core`: domain models, validation, privacy rules, tag taxonomy, rarity scoring.
- `db`: schema and migrations targeting standard Postgres/PostGIS.
- `storage`: original/private image storage and public derivative storage.
- `auth`: owner/session/role interface.
- `ai`: identification and fact-generation provider interface.
- `search`: visual comparison image provider interface.
- `web`: mobile-first Next.js PWA.
- `providers/supabase`: Supabase auth/database/storage adapter.
- `providers/local`: local/self-host adapters.

The web app should call domain services and APIs rather than reaching directly into provider-specific clients across the codebase.

## 4. Privacy and OPSEC Decisions

### Image Metadata

Any image displayed publicly on the web must be an EXIF-stripped derivative.

Original images may be stored privately if needed for owner-only review, reprocessing, or archival use. Originals should never be served publicly.

### Location Storage

The system should store:

- Exact private coordinates when available from EXIF or owner entry.
- Public generalized/fuzzed coordinates.
- Public area label.
- Coordinate uncertainty or generalization metadata.
- Whether location data was withheld or generalized.

### Public Location Display

Public viewers should see:

- A general area label such as "near Wimberley, TX" or "Hays County, TX."
- A public fuzzed/randomized point suitable for map exploration.

The app should avoid naive random-radius display around exact coordinates because repeated public observations from home could statistically reveal the true location.

Recommended default: use a coarse cell-based obfuscation strategy inspired by citizen-science geoprivacy patterns. A 0.2 degree by 0.2 degree cell is a useful starting point for discussion in the Texas Hill Country, roughly tens of kilometers wide depending on latitude.

### Home Privacy

The owner is specifically concerned about exposing home location.

The app should support a stronger home privacy mode:

- Owner can define private places such as "home."
- Observations near a private place get stronger public generalization.
- Public labels may be county/region-level rather than "near" a smaller town.
- Exact points remain visible only in the private logged-in view.

### Private Location Display

Logged-in owner view should show:

- Exact GPS coordinates.
- Original EXIF metadata.
- Exact observation map.
- Private heatmap.
- Filters by date, category, taxon, place, and privacy level.

## 5. Add Observation Flow

### Preferred Path: Upload Photo

The preferred owner workflow begins with a photo upload.

High-level flow:

1. Owner uploads a photo.
2. System reads EXIF privately.
3. System stores original privately if configured.
4. System creates EXIF-stripped public derivative.
5. System runs AI identification.
6. System returns suggested ID, confidence, reasoning, uncertainty, and lookalikes.
7. System loads web-search comparison thumbnails for the suggested entity and likely lookalikes.
8. Owner accepts, refines, disagrees, creates a mystery entry, or enters manually.
9. System creates an observation and links it to a confirmed or mystery entry.

### Fallback Path: Manual Observation

The owner can record an observation without a photo.

Manual observations should support:

- Date and time.
- Exact private location, if known.
- Public location generalization.
- Category or organism group.
- Suspected common/scientific name.
- Notes.
- Sound/call/track/behavior descriptions.
- Mystery entry creation.

This matters for bird calls, tracks, dens, burrows, frog calls, fleeting sightings, and moments where taking a photo is not possible.

## 6. AI Identification Flow

### Suggest and Confirm

AI identification is suggest-and-confirm only.

Nothing becomes public as a confirmed ID until the owner approves it.

The AI result should include:

- Suggested common name.
- Suggested scientific name when available.
- Confidence score.
- Short reasoning.
- Uncertainty flags.
- Lookalike candidates.
- Safety note if relevant.
- Recommended type tags.
- Recommended rarity inputs or source queries.

### Visual Comparison

The initial AI response should show web-search comparison thumbnails.

Requirements:

- Thumbnails for the suggested entity.
- Thumbnails for likely lookalikes when useful.
- Source domain shown subtly.
- Click/tap opens a gallery.
- Gallery supports swipe left/right on mobile.
- Gallery includes a primary "Accept ID" CTA.
- Gallery includes a secondary "Refine ID" CTA.
- Original result view also includes "Accept ID" and "Refine ID."

The app should avoid permanently storing third-party thumbnails unless their license permits it. In v1, external thumbnails should be treated as transient comparison aids with source links.

### Refining or Pushing Back on AI

The disagreement path should be framed as "Refine ID" rather than a confrontational "Wrong."

Refinement inputs:

- Wrong group.
- Right group, wrong species.
- Looks more like free text.
- Important traits such as color, size, wing shape, leaf shape, flower count, sound, behavior, habitat.
- Private location context.
- Season/date context.
- User notes.

The second AI pass should include:

- Original image.
- Original suggestion.
- User correction.
- Added trait notes.
- Date/season.
- Private ecoregion or approximate locality.
- Any candidate species proposed by the owner.

The output should return revised top candidates, confidence, and reasoning.

### Audit Trail

The system should keep an identification audit trail:

- AI suggestion and confidence.
- Owner refinements.
- Final accepted ID.
- Date accepted.
- Whether an ID was later changed.

This helps future review and makes mystery resolution traceable.

## 7. Existing Entry Match Flow

If AI identifies a creature that already exists in DripDex, the system should present a match screen.

The match screen should compare:

- Current default DripDex photo.
- Newly uploaded photo.
- Suggested ID and confidence.
- Relevant lookalikes.

Owner actions:

- Add as observation photo.
- Set as new default photo.
- Create separate entry.
- Refine ID.
- Mark as not this species.

If the new photo becomes the default, the previous default remains available in the gallery and observation history.

## 8. Mystery Entries and Investigation

The system should support mystery entries for unidentified or uncertain organisms.

Examples:

- "Unknown jumping spider."
- "Unidentified oak."
- "Frog call near creek."
- "Small yellow flower by roadside."

Mystery entries can store:

- Photos.
- No-photo observations.
- Candidate IDs.
- AI attempts.
- Owner notes.
- External research links.
- Investigation status.

Statuses:

- Needs ID.
- Likely.
- Confirmed.
- Rejected candidate.

When resolved, a mystery entry can be promoted or merged into a confirmed DripDex entry without losing observation history.

Investigation workspace should include shortcuts or references for relevant external tools such as iNaturalist, eBird, BugGuide, and plant databases appropriate to the organism type.

## 9. Public Browsing Experience

### Primary Browse Mode

Public visitors primarily browse by category and creature cards.

The map is secondary, not the main entry point.

### Creature Cards

Cards should feel collectible and fun while remaining grounded in real observations.

Card contents:

- Entry number.
- Common name.
- Scientific name when confirmed.
- Default photo or mystery silhouette.
- Category icon.
- Type chips.
- Rarity treatment.
- Seen count.
- Last seen season or month.
- Public area label.
- Status: confirmed, likely, mystery.

### Seen Near Me

The app should support a "Seen Near Me" discovery view.

Flow:

1. Visitor grants browser location.
2. App compares visitor location against public generalized observation locations.
3. App shows nearby cards grouped by category.

This view should never reveal private exact coordinates. It should use public fuzzed/generalized locations only.

## 10. Creature Detail Experience

The creature detail page should open as a scan screen rather than a plain article.

Top hero:

- Large default photo.
- Entry number.
- Scan-frame visual treatment.
- Type chips.
- Rarity/card styling.
- Short kid-friendly flavor text.
- Simple "observe safely" note when relevant.
- Recent/public sighting summary.

Below the hero:

- Photo gallery.
- Variants.
- Observation timeline.
- Public generalized map.
- Expandable adult/science sections.

Adult/science accordions:

- Taxonomy.
- Habitat.
- Range.
- Behavior.
- Seasonality.
- Conservation status.
- Lookalikes.
- Safety.
- Sources and citations.

The first view should hook a child. The accordions should reward adult curiosity.

## 11. Tags, Rarity, and Game Flavor

### Type Tags

The app should use a controlled tag list that covers most organisms, with AI suggestions and owner approval.

Draft tag categories:

- Habitat: Woodland, Grassland, Riparian, Aquatic, Cave, Urban, Garden, Roadside.
- Activity: Nocturnal, Crepuscular, Diurnal.
- Movement/behavior: Flying, Swimming, Burrowing, Climbing, Pollinator, Predator, Scavenger, Parasite, Mimic, Camouflaged.
- Interaction/safety: Venomous, Poisonous, Stinging, Biting, Irritating, Edible, Medicinal, Fragile, Protected.
- Appearance: Flowering, Spotted, Striped, Iridescent, Fuzzy, Armored, Tiny, Large, Bright, Cryptic.
- Ecology/status: Native, Endemic, Introduced, Invasive, Migratory, Rare, Common, Indicator Species.
- Seasonality: Spring, Summer, Fall, Winter, Rain-Loving, Drought-Tolerant.

The final controlled list should be broad enough for 90 percent of entries but small enough to avoid tag sprawl.

### Rarity

The app should distinguish collection rarity from ecological rarity.

Collection rarity:

- Based on the owner's field journal.
- Examples: first sighting, only seen once, first county, first season, night-only find.

Ecological rarity:

- Based on cited external sources.
- May include conservation status, range, local occurrence, county records, and frequency in public datasets.

This distinction prevents confusion when something is personally rare but ecologically common, or ecologically sensitive but locally observable.

### Visual Flare

Fun visual treatments should appear in both public and private views when they are not personal/private achievements.

Visual flare opportunities:

- New entry reveal.
- Scan animation.
- Silhouette unlock.
- Type chip colors/icons.
- Rarity/card frames.
- Variant badges.
- Mystery shadow cards.
- Investigation status.
- Habitat set collections.
- Seasonal sets.
- Photo upgrade comparison.
- Lookalike comparison.

Personal achievements should remain private when they depend on exact location, private heatmap data, or personal activity patterns.

### Variants

The app should support variant visuals and records.

Variant examples:

- Male.
- Female.
- Juvenile.
- Seasonal plumage.
- Flower.
- Fruit.
- Seed.
- Caterpillar.
- Adult insect.
- Web.
- Track.
- Call.
- Nest or burrow, with stronger privacy/safety handling.

## 12. Facts and Citations

LLMs should help generate consistent facts and fun descriptions, but facts must be cited from reputable sources.

The app should separate:

- Flavor text for kids.
- Source-backed scientific facts.
- Safety notes.
- Conservation/status facts.
- Rarity inputs.

Sources should be stored with facts and displayed in adult/science sections.

Potential reputable sources:

- Texas Parks and Wildlife Department.
- NatureServe.
- USFWS.
- Cornell/eBird for birds.
- BugGuide for insects and arachnids.
- iNaturalist as a discovery/reference aid, not sole authority.
- GBIF for occurrence data.
- USDA Plants and regional plant databases.
- Academic or extension sources when relevant.

## 13. Tech Stack Direction

### Recommended First Build

Build a mobile-first web app/PWA first, with clean API boundaries for future native clients.

Recommended stack:

- Next.js App Router for public web/PWA.
- TypeScript across the app.
- Postgres with PostGIS for observation/location data.
- Supabase as the likely managed SaaS provider for auth, database, storage, and Row Level Security.
- Provider adapters so Supabase can be swapped or self-hosted alternatives can be used.
- Object storage for originals and public derivatives.
- Server-side image processing for EXIF stripping and resizing.
- LLM provider interface for identification and fact generation.
- Search provider interface for comparison thumbnails.

### Native App Future

Future Android/iOS should be treated as another client of the same backend/API.

Likely future path:

- Expo/React Native for native apps.
- Shared TypeScript types and validation schemas.
- Shared API client.
- Shared domain logic where practical.

Do not over-optimize v1 around native UI reuse. Prioritize public web discoverability, mobile ergonomics, and clean APIs.

## 14. MVP Jobs To Be Discussed Next

The next brainstorming step is to define the jobs to be done for the MVP.

Initial candidate jobs:

- As a public visitor, I want to browse local creatures by category so I can discover what lives around me.
- As a kid or family member, I want the creature pages to feel fun and approachable so I want to keep exploring.
- As an adult learner, I want expandable scientific details and citations so I can trust and learn from the app.
- As the owner, I want to upload a photo and get an AI-assisted ID so I can quickly record an observation.
- As the owner, I want to challenge or refine the AI suggestion so I can avoid bad identifications.
- As the owner, I want to record observations without photos so I can capture calls, tracks, fleeting sightings, and notes.
- As the owner, I want exact private GPS and heatmaps so I can understand my own field activity.
- As the owner, I want public locations fuzzed so I do not reveal my home or sensitive places.
- As a future self-hosting user, I want the app to run with low infrastructure commitment so I can use it for a family or classroom project.

These should be refined into final MVP jobs and user journeys before implementation planning.

## 15. MVP User Journeys To Be Discussed Next

The next step is to walk through the core journeys in detail.

Candidate MVP journeys:

- Public visitor browses category cards.
- Public visitor opens a creature scan page.
- Public visitor uses "Seen Near Me."
- Owner logs in.
- Owner uploads a photo and accepts an AI identification.
- Owner uploads a photo and refines/disagrees with the AI identification.
- Owner uploads a photo that matches an existing DripDex entry and chooses how to use it.
- Owner records a no-photo observation.
- Owner creates or updates a mystery entry.
- Owner reviews exact private map and heatmap.
- Owner edits a creature entry's tags, rarity, flavor text, facts, or default photo.

## 16. Open Design Questions

Questions remaining before implementation planning:

- What are the exact MVP jobs to be done?
- Which journeys are required for v1 versus later?
- What is the final controlled type-tag list?
- What is the exact default public geoprivacy cell size and home-zone policy?
- Which AI provider should be used first?
- Which search provider should supply comparison thumbnails?
- How much citation generation is automated in v1?
- What moderation or review is required before public changes appear, given the single-owner model?
- What visual style should be used for the Pokédex-inspired shell while avoiding direct copying of protected Pokémon assets?

## 17. Source References Captured So Far

Reference images in the local repo:

- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/UI.webp`
- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/pokedex-embodiment.webp`
- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/pokedex-embodiment2.webp`
- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/200.webp`
- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/256.webp`
- `/Users/clarkdever/Documents/code/pokedex/docs/inspiration/256px-Pokédex_Image_Azurill_SV.webp`

External references to revisit during planning:

- iNaturalist geoprivacy: https://www.inaturalist.org/pages/geoprivacy
- iNaturalist help on obscured observations: https://help.inaturalist.org/
- GBIF sensitive species best practices: https://docs.gbif.org/sensitive-species-best-practices/
- GBIF data quality recommendations: https://techdocs.gbif.org/en/data-publishing/data-quality-recommendations
- NatureServe conservation status categories: https://www.natureserve.org/nsexplorer/about-the-data/statuses/conservation-status-categories
- Texas Parks and Wildlife rare species by county: https://tpwd.texas.gov/gis/rtest/
- Texas Parks and Wildlife listed species: https://tpwd.texas.gov/wildlife/wildlife-diversity/nongame/listed-species/
- Next.js App Router docs: https://nextjs.org/docs/app
- Expo web support: https://docs.expo.dev/workflow/web/
- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase self-hosting docs: https://supabase.com/docs/guides/self-hosting
- Vercel Hobby plan docs: https://vercel.com/docs/plans/hobby
