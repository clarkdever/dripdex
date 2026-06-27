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
2. System immediately creates a draft observation tied to the uploaded file.
3. Photo appears in the shared capture preview.
4. System reads EXIF privately in the background.
5. System stores original privately if configured.
6. System creates EXIF-stripped public derivative in the background.
7. System starts AI identification in the background using the full image and any available date/location context.
8. Owner taps the subject to target it while background processing continues.
9. Scanner overlay animates a target lock at the tapped point.
10. System updates the draft with the normalized subject point.
11. AI analysis is updated or refined with the subject point if the first pass has not completed, or a follow-up refinement is queued if it has.
12. Scanner overlay progressively enhances as model results arrive, including candidate subject regions when available.
13. System returns suggested ID, confidence, reasoning, uncertainty, and lookalikes.
14. System loads web-search comparison thumbnails for the suggested entity and likely lookalikes.
15. Owner accepts, refines, disagrees, creates a mystery entry, or enters manually.
16. System updates the draft observation and links it to a confirmed or mystery entry.
17. Owner saves/publishes the completed observation.

Draft creation is optimistic. Once the photo upload succeeds, DripDex should save a recoverable draft and progressively update it as EXIF extraction, public derivative generation, target locking, AI identification, and owner review complete.

### Draft Visibility and Recovery

Draft observations should not disappear into a separate hidden queue. In the logged-in owner view, drafts should appear in the same creature card index as saved entries, clearly tagged as Draft.

Draft behavior:

- Drafts are private by default and never visible to public visitors.
- Draft cards are searchable and filterable by Draft status.
- Draft cards can represent a known candidate, an unidentified mystery, or an incomplete upload.
- Opening a draft resumes the capture/review flow at the most useful incomplete step.
- If the owner leaves after upload, the draft remains recoverable from the private card index.
- Failed EXIF or AI processing should not hide the draft.
- Public publishing requires an explicit owner action after review.

### Capture Entry Point

The capture start screen should offer three clear actions:

- Upload Photo.
- Open Scanner.
- Log Without Photo.

Upload Photo is the primary owner path because real field capture often happens through the OS camera shortcut, professional gear, or an existing photo library.

Open Scanner is the playful in-app path. It should give the "I have a device scanner" feeling for kids and families. In MVP, it can be stubbed or implemented as a browser-camera/file-picker path, but it should converge into the same shared capture preview once a photo exists.

Log Without Photo is the fallback for calls, tracks, fleeting sightings, behavior notes, and other observations where no image is available.

### Manual Target Lock

After a photo is loaded, DripDex should ask the owner to tap the subject while background analysis begins.

Target-lock interaction:

1. Photo appears with a cyberpunk/anime-inspired HUD overlay above it.
2. Overlay prompts: "Tap the subject."
3. Owner taps the creature, plant, track, flower, or other observation target.
4. A vertical line travels down from the top edge toward the tapped Y coordinate.
5. A horizontal line travels in from the left edge toward the tapped X coordinate.
6. The lines meet at the tapped point to form a crosshair.
7. The crosshair blinks.
8. Two corner brackets appear around the target zone, showing only upper-left and lower-right 90 degree angles rather than a full square.
9. Overlay text resolves to "Subject located."
10. Target marker fades or collapses into the analysis HUD.
11. The draft is updated with the tap coordinate as image-relative metadata, and the analysis HUD continues.

This is intentionally not computer vision. The user supplies the subject point, and DripDex makes the moment feel like the device acquired the subject. The point may later help with crop suggestions, model prompts, or image-region analysis, but it should not be treated as proof of identity.

Scanner effects are cosmetic and assistive, not authoritative. Identification remains suggest-and-confirm.

### Progressive Scanner Overlay

The scanner overlay should improve as background model results arrive.

Initial state:

- Shows the loaded photo.
- Prompts the owner to tap the subject.
- Animates HUD lines, status lights, and target-lock feedback.

Progressive model-enhanced state:

- If the model returns candidate subjects with approximate regions, DripDex may briefly display ghost brackets, faint outlines, or numbered candidate pings.
- Candidate regions should be visually subordinate to the user-selected target.
- If a candidate region overlaps the user's tap target, the overlay can reinforce it with copy such as "Target match likely."
- If model candidates do not overlap the user's target, DripDex should continue with the user-selected target and avoid arguing in the scan overlay.
- Candidate regions can be used for fun HUD feedback and later review, but the user tap remains the authoritative MVP target.

Model-returned subject coordinates should be stored as suggestions, not truth. The schema should allow multiple candidate regions with labels, confidence, and source model so DripDex can improve later without changing the capture UX.

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
- Optional candidate subject regions with approximate coordinates, labels, confidence, and source model.
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
- Generated/editable nickname in the logged-in owner view.
- Default photo or mystery silhouette.
- Category icon.
- Collapsed tag-family controls with iconography and labels.
- Rarity treatment.
- Active variant/life-stage badge when the card is showing a specific find.
- Multiple-find controls when more than one observation/photo exists.
- Seen count.
- Last seen season or month.
- Public area label.
- Status: confirmed, likely, mystery.

In the logged-in owner view, the same card index should also include private draft cards tagged as Draft. Draft cards are excluded from public browsing until saved/published.

### Creature Card Visual Decisions

The House Finch mockup in `/docs/mockups/tag-display-options.html` is the current card-design inspiration.

Design decisions from the mockup:

- Use a vertically oriented mobile-card composition, roughly 9:16 in spirit.
- Keep the creature image as the focal point.
- Treat rarity as the image/card frame treatment, not as another chip.
- Show only one active sex/variant/life-stage badge on the image at a time.
- Use mid-image left/right arrows and small dots for multiple finds, similar to a lightweight social carousel.
- Do not show redundant overlay text such as "Male Find" when the active variant badge already communicates it.
- Put the generated nickname above the species/common-name section.
- Let the nickname be generated from tag/type-specific word lists, editable on click, autosaved, and overwritten by an explicit shuffle action.
- Place shuffle as a small icon button on the left side of the nickname row to reduce accidental overwrites.
- Keep tag families collapsed by default as icon + word controls.
- Expand a tag family into readable pills only when tapped.
- Avoid helper copy on the card when the control itself is understandable.

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

The first view should hook a child. The accordions should reward adult curiosity. The current mockup uses "Would you like to know more?" as the adult-science expansion text; this tone is intentionally playful, while the expanded content should remain citation-backed and reviewable.

## 11. Tags, Rarity, and Game Flavor

### Tag Families

The app should use controlled tag lists that cover most organisms, with AI suggestions and owner approval.

Tag display should be compact by default. On creature cards and scan/detail surfaces, show tag families as icon + word controls. When a user taps a family, expand that family into readable pills. Icons may begin as emoji placeholders in prototypes but should later become consistent custom icons.

MVP tag families:

- Core type tags: Plant, Flying, Bug, Water, Ground, Rock, Poisonous, Venomous, Dark, Light, Camouflage, Armored, Singing, Stinging.
- Food-chain role tags: Producer, Pollinator, Herbivore, Carnivore, Omnivore, Predator, Prey, Decomposer, Scavenger, Parasite, Seed Spreader.
- Habitat/behavior tags: Woodland, Grassland, Creekside, Pond, Garden, Urban, Porch Light, Roadside, Cave, Burrowing, Climbing, Swimming, Web Builder, Migratory, Native, Introduced, Invasive, Rain-Loving, Drought-Tolerant.
- Seasonality tags: Spring, Summer, Fall, Winter, Year-Round.
- Variant/life-stage tags: Male, Female, Juvenile, Adult, Egg, Larva, Nymph, Pupa, Track, Call, Nest, Burrow, Scat, Flower, Bud, Fruit, Seed, New Growth, Dormant, Fruiting Body, Mycelium, Bracket, Lichen Form.
- Safety/interaction tags: Look Only, Do Not Touch, Venomous, Poisonous, Stinging, Biting, Irritating, Sharp, Fragile, Protected, Allergen, Invasive Concern, Reportable.

Avoid public kid-facing Edible or Medicinal tags in MVP because they can encourage unsafe experimentation.

The final controlled lists should be broad enough for most entries but small enough to avoid tag sprawl.

### Generated Nicknames

Kids like naming collected creatures, so logged-in cards should support a generated nickname.

Nickname behavior:

- Generate nicknames from word lists associated with the creature's approved tags/types.
- Combine two randomly selected relevant word-list entries, such as a Flying word and a Singing/Garden word.
- Show the generated name as text by default.
- Clicking the name turns it into an editable input.
- Edits autosave.
- A shuffle/recycle icon generates a new nickname and overwrites the current saved nickname.
- The shuffle control should be visually separate from the editable field, placed on the left in the current mockup, to reduce accidental overwrites.

### Rarity

The app should distinguish collection rarity from ecological rarity.

Collection rarity:

- Based on the owner's field journal.
- Examples: first sighting, only seen once, first county, first season, night-only find.

Ecological rarity:

- Based on cited external sources.
- May include conservation status, range, local occurrence, county records, and frequency in public datasets.

This distinction prevents confusion when something is personally rare but ecologically common, or ecologically sensitive but locally observable.

Visual rule: rarity should primarily be expressed as a card/image frame treatment: color, border, pattern, shine, corner marker, or special frame. It should not consume tag-chip space unless a compact fallback is needed.

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

Card/display rules:

- The active find can show one sex/variant/life-stage icon on the image.
- If multiple finds/photos exist, use simple carousel controls and dots rather than a separate tall gallery bar.
- Variant/life-stage tags can still appear in the Variant family when expanded, but the active image should show only its current badge.
- Future gamification should support collecting all relevant life stages/forms for a creature.

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

## 14. MVP Jobs To Be Done

Prioritized MVP jobs:

1. Capture a find.
   When I see something interesting outdoors, I want to quickly capture it with a photo or manual note, so I do not lose the moment.
2. Identify a find.
   When I upload or record a find, I want help identifying it with AI, comparison images, and a way to correct/refine, so I can avoid bad entries.
3. Resume unfinished finds.
   When I get interrupted, I want drafts to appear in my private card index, so I can finish them later.
4. Search my collection.
   When I want to find something I have collected, I want to search and filter creature cards, so I can quickly revisit observations, drafts, mysteries, and published entries.
5. Browse public DripDex.
   When a visitor opens the site, they want to browse local creatures by category and cards, so they can discover what lives nearby.
6. Learn from a creature card.
   When I open a creature, I want a kid-friendly card first and expandable adult science, so it is fun for kids and still useful for adults.
7. Protect sensitive location data.
   When an observation has location data, I want exact coordinates kept private and public locations fuzzed, so I can share safely without revealing home or sensitive spots.
8. Manage creature entries.
   When an ID is accepted, I want to add it to an existing entry or create/update an entry, so the collection stays organized.
9. Investigate mysteries.
   When I cannot identify something confidently, I want to save it as a mystery with notes/candidates, so I can research it later.

Lightweight/non-blocking MVP jobs:

1. Compare multiple finds.
   When I have several observations of the same creature, I want to browse photos, variants, and life stages, so I can see how my collection is growing.
2. Search near me.
   When a public visitor shares approximate location, they want to see local cards nearby, so they can explore their own environment.

## 15. MVP User Journeys To Be Discussed Next

The next step is to walk through the core journeys in detail.

Candidate MVP journeys:

- Public visitor browses category cards.
- Public visitor opens a creature scan page.
- Public visitor uses "Seen Near Me."
- Owner logs in.
- Owner starts a capture from Upload Photo or Open Scanner.
- DripDex saves a draft immediately and processes EXIF, image derivatives, and AI analysis in parallel.
- Owner can find unfinished drafts in the private card index by filtering for Draft status.
- Owner taps the subject and sees the target-lock animation.
- Owner uploads a photo and accepts an AI identification.
- Owner uploads a photo and refines/disagrees with the AI identification.
- Owner uploads a photo that matches an existing DripDex entry and chooses how to use it.
- Owner records a no-photo observation.
- Owner creates or updates a mystery entry.
- Owner reviews exact private map and heatmap.
- Owner edits a creature entry's tags, rarity, flavor text, facts, or default photo.

## 16. Open Design Questions

Questions remaining before implementation planning:

- Which journeys are required for v1 versus later?
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

Mockup references in the local repo:

- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/tag-display-options.html`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/tag-display-options-full-page.png`

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
