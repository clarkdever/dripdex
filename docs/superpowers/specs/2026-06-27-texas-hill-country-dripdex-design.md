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
- SQLite-first local data model, with Postgres/PostGIS available for the managed SaaS and advanced installs.

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
- `db`: schema, migrations, and repository interfaces, with SQLite as the open-source default.
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

Location privacy modes:

- `exact_private`: owner-only exact GPS, EXIF, private map, and heatmap.
- `public_obscured`: public point generated once inside a stored coarse cell.
- `public_region_only`: no public point; show only a broad label such as county, region, or "Texas Hill Country."
- `private_location`: no public location label beyond "Location protected."

MVP defaults:

- Default public mode: `public_obscured`.
- Default obscuring cell: `0.2 x 0.2 degrees`.
- Default home-zone mode: `public_region_only`.
- Default sensitive-species/location mode: `public_region_only` or `private_location`.
- Public derived points should be generated once at publish time and stored. Do not regenerate a new random point on every page load, because repeated randomization can leak the true center over time.

### Home Privacy

The owner is specifically concerned about exposing home location.

The app should support a stronger home privacy mode:

- Owner can define private places such as "home."
- Observations near a private place get stronger public generalization.
- Recommended default home-zone radius: `20 km / about 12 miles`.
- Public labels may be county/region-level rather than "near" a smaller town.
- Exact points remain visible only in the private logged-in view.
- Home-zone geometry is owner-only and should never be returned by public APIs.

### Private Location Display

Logged-in owner view should show:

- Exact GPS coordinates.
- Original EXIF metadata.
- Exact observation map.
- Private heatmap.
- Filters by date, category, taxon, place, and privacy level.

### Preferences Page

DripDex needs an owner Preferences page so privacy, safety, and integration choices are explicit instead of scattered through capture screens.

MVP preference groups:

- Location privacy defaults: default public mode, home-zone behavior, sensitive-species behavior, and public label style.
- Private places: add/edit home and other private zones.
- Image handling: original retention, public derivative generation, and EXIF stripping reminder.
- Public sharing: guestbook moderation, public intro visibility defaults, and public map behavior.
- Safety language: global launch warning, field-safety reminders, and creature safety label visibility.
- Integrations: iNaturalist export/connect settings.

Preferences rules:

- Safe defaults should be preselected.
- The owner can make privacy stricter at any time.
- In MVP, sensitive taxa, nests, dens, roosts, burrows, and home-zone observations should not be downgraded below the required privacy rule.
- Public previews should show what visitors will see before publishing or exporting.

### iNaturalist Integration

DripDex should support optional iNaturalist sharing for owners who want their observations to contribute to the larger citizen-science community.

Before offering any connection, post, or CSV export, DripDex should explain iNaturalist in plain language:

- iNaturalist is a public citizen-science community where people share nature observations and help each other identify organisms.
- Shared observations may be visible outside DripDex, including photos, dates, notes, and location information according to the chosen iNaturalist geoprivacy.
- iNaturalist has its own account, community, licenses, privacy settings, and terms.
- Kids should use this through a parent/owner account when required by iNaturalist terms and family rules.
- DripDex will never auto-post observations; the owner chooses what to export or send.

Recommended integration path:

1. MVP: generate an iNaturalist-ready CSV export for selected observations.
2. MVP: add a per-observation "Prepare for iNaturalist" action that previews exactly what will be shared.
3. Later: add OAuth/PKCE account connection for direct posting once core DripDex flows are stable.
4. Later: store sync metadata such as `inat_observation_id`, sync status, last synced time, export errors, and whether the iNaturalist copy uses a different geoprivacy mode.

iNaturalist privacy mapping:

- `public_obscured` maps to iNaturalist `obscured`.
- `public_region_only` should export as `private` or omit exact coordinates unless the owner intentionally chooses otherwise.
- `private_location` maps to iNaturalist `private` or no export.
- Home-zone observations should default to `private` or no coordinates.
- Public-safe image derivatives should be used by default. Original EXIF should not be uploaded unless the owner explicitly chooses to send it.

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
7. System starts Gemini-first AI analysis in the background using the full image and any available date/location context.
8. Owner taps the subject to target it while background processing continues.
9. Scanner overlay thanks the owner for helping and records the tap as the owner's target hint.
10. System updates the draft with the normalized subject point.
11. When model bounding boxes arrive, DripDex reconciles them against the owner tap by checking whether the tap falls inside a box, then by finding the nearest box when it does not.
12. Scanner overlay progressively enhances as validated model results arrive, including candidate subject regions when available.
13. System returns suggested ID, confidence, reasoning, uncertainty, and lookalikes.
14. System loads web-search comparison thumbnails for the suggested entity and likely lookalikes.
15. Owner accepts, refines, disagrees, creates a mystery entry, or enters manually.
16. System updates the draft observation and links it to a confirmed or mystery entry.
17. System evaluates lightweight gamification triggers and queues any celebration modals.
18. Owner saves/publishes the completed observation.

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

### Celebration Hook

Every completed capture should include a small celebration moment so the app keeps rewarding outdoor curiosity.

After an observation is accepted, saved as a mystery, manually logged, or linked to an existing entry, DripDex should show a baseline celebration such as "Find logged," "Added to your field journal," or "Mystery saved." Then DripDex should evaluate a small set of achievement-style triggers and queue any earned bonus celebrations. This should be event-driven and optional, not tangled into the scanner state machine.

Draft saves should get a smaller positive confirmation such as "Saved for later," but should not trigger the full celebration stack until the owner completes or intentionally saves the observation.

Example celebration triggers:

- Capture Complete: every saved observation or mystery.
- First Find: first saved observation.
- First of This Type: first creature with a newly collected type tag.
- Life Cycle Complete: all configured life-stage variants collected for a creature.
- Bug Collector: milestone count for bug-type or insect observations.
- Fish Finder: milestone count for fish or water-creature observations.
- Bird Buddy: milestone count for bird or flying observations.
- Mystery Maker: saved a mystery observation instead of losing the moment.
- Local Legend: first rare or elusive find.

Celebration UI should be visually playful and kid-readable:

- Modal or bottom-sheet presentation on mobile.
- Short title.
- One-sentence explanation.
- Creature/photo thumbnail when relevant.
- Primary action returns to the capture review or creature card.
- Secondary action can view the collection only when it does not interrupt saving.

Personal-only achievements should remain private. Collection facts that are already public, such as a creature's rarity frame or first public find, can be visually fun in both public and private views.

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
7. Overlay text thanks the owner for helping while AI results continue in the background.
8. The draft is updated with the tap coordinate as image-relative metadata, and the analysis HUD continues.
9. When a model box is reconciled with the tap, the crosshair blinks.
10. Two corner brackets appear around the target zone, showing only upper-left and lower-right 90 degree angles rather than a full square.
11. Overlay text resolves to "Subject located."
12. Target marker fades or collapses into the analysis HUD.

The tap gesture itself is intentionally not computer vision. The user supplies the subject point, and DripDex makes the moment feel like the device acquired the subject. The point may later help with crop suggestions, model prompts, or image-region analysis, but it should not be treated as proof of identity.

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
- If a candidate region contains the user's tap target, DripDex should animate the bracket to that region and update copy to "Subject located."
- If no region contains the tap, DripDex should find the nearest candidate box to the tap and use it as a low-friction suggestion.
- If the nearest candidate is plausible, DripDex may animate toward it while treating the owner tap as the intent signal.
- If the nearest candidate is clearly far from the tap, DripDex should continue with the user-selected target and avoid arguing in the scan overlay.
- Candidate regions can be used for fun HUD feedback and later review, but the user tap remains the authoritative MVP target.

Model-returned subject coordinates should be stored as suggestions, not truth. The schema should allow multiple candidate regions with labels, confidence, and source model so DripDex can improve later without changing the capture UX.

### Target Reconciliation

DripDex should store both the owner target point and any model-returned boxes.

Reconciliation rules:

1. Normalize all coordinates into the same image coordinate space before comparing them. Gemini boxes are expected as `0-1000` normalized coordinates and should be converted into DripDex's internal image-relative format.
2. If the owner tap falls inside one or more candidate boxes, pick the smallest high-confidence containing box as the active target.
3. If the tap falls outside all boxes, find the nearest candidate box by distance from the tap to the box edge or center.
4. If the nearest box is close enough to feel plausible, use it for the visual bracket while recording that the owner tap selected it by proximity.
5. If all boxes are far away or low-confidence, keep the tap point as the target and store model boxes as alternate suggestions for review.
6. If no model boxes arrive in a reasonable MVP timeout, accept the tap-only target so the owner can keep moving.

The UI copy should stay simple for kids. It should say "Thanks for helping" after the tap, then "Subject located" only after a target region is reconciled or the tap-only fallback is accepted.

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

Gemini should be the first AI provider because its image-understanding flow can return both likely identifications and object bounding boxes. DripDex should still call Gemini through an internal provider interface so a future model can replace it without changing the capture UI.

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

### Streaming and Validation

The AI pipeline should support progressive updates, but the browser should not consume raw model substrings as software inputs.

Recommended flow:

1. Server sends Gemini a structured-output prompt that asks for data in the order DripDex can use it: subject regions, identity candidates, existing-entry match inputs, tag suggestions, kid flavor text, adult science facts, and citations.
2. Server receives model output and converts each complete validated unit into a DripDex scan event.
3. Each event is validated with a schema such as Zod or JSON Schema before it can update the draft or UI.
4. Browser receives only DripDex scan events, not raw model text.
5. If streaming fails or a partial event cannot be validated, DripDex keeps the draft and falls back to the last valid event.

This keeps the scanner feeling fast without trusting half-formed text. Closed-tag parsing is not required for MVP if the backend emits typed events after validation.

Example scan event sequence:

1. `subject_region`: candidate boxes and labels.
2. `identity_candidates`: possible common/scientific names and confidence.
3. `existing_match`: whether the likely ID matches an existing DripDex entry.
4. `tag_suggestions`: type, food-chain, habitat, season, variant, and safety tags.
5. `kid_flavor`: short card copy.
6. `science_facts`: cited adult facts.
7. `scan_complete`: final event for the capture review screen.

### Parallel AI Work

DripDex should start with one Gemini scan for MVP, then fan out independent work once a likely identity is available.

Parallel follow-up tasks can include:

- Existing-entry lookup by common name, scientific name, and aliases.
- Comparison thumbnail search.
- Type and food-chain tag suggestion.
- Kid-friendly flavor text generation.
- Adult science fact generation with citations.
- Safety note generation.
- Rarity input collection from local occurrence or trusted references.

These jobs should update the draft independently as results arrive. Slow citation or fact generation should not block the owner from reviewing the identification.

### Seeded Species Cache

Because DripDex focuses on Texas Hill Country and likely handles hundreds rather than millions of entries, it should cache common generated content.

The cache can include:

- Preloaded common Hill Country species and aliases.
- Stable kid-friendly voice examples.
- Tag suggestions.
- Common lookalikes.
- Safety notes.
- Citation-backed fact summaries.

Cache keys should include the scientific name when known, the content type, and a prompt/schema version. Cached content should be editable and refreshable, not treated as permanent truth.

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

### Identify A Find Journey

The MVP identification journey should be direct and recoverable.

Flow:

1. Scanner returns the best candidate with common name, scientific name when available, confidence, short reasoning, safety note when relevant, and "Possible match found" status.
2. Review screen shows visual comparison thumbnails for the suggested creature, useful lookalikes, and the current DripDex entry photo if there may already be an existing match.
3. Tapping a thumbnail opens the swipeable gallery with "Accept ID" as the primary action.
4. If the owner accepts the ID, DripDex links the observation to an existing creature when matched, or creates a new creature draft when it is new.
5. If the owner refines the ID, DripDex uses kid-readable correction choices plus lookahead fields rather than a blank form.
6. If confidence is low or the owner is unsure, DripDex can save the observation as a Mystery with the photo, tap point, model boxes, notes, and candidate IDs intact.
7. If the owner enters an ID manually, the input should use lookahead across existing DripDex creatures, cached Hill Country species, aliases, common names, and scientific names.
8. If the accepted ID matches an existing entry, DripDex moves into the existing-entry match flow.
9. The done state is a friendly "Ready for the journal" review with accepted, mystery, or manual identity; suggested tags; private exact location; protected public location; and Save/Publish actions.

Refine ID choices should favor simple labels:

- Different kind.
- Same kind, different creature.
- Color or pattern.
- Size or shape.
- What it was doing.
- Where I found it.
- I know the name.

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

This is the "we already know this one" moment. It should be short, visual, and hard to misuse.

Trigger:

- Gemini suggests a likely match to an existing creature.
- Manual lookahead selects an existing creature.
- A refined ID resolves to an existing creature.

The match screen should compare two large image panels:

- Current default DripDex photo.
- Newly uploaded photo.

Supporting details:

- Suggested ID and confidence.
- Current entry number.
- Existing seen count.
- Relevant variant or life-stage difference when known.
- Relevant lookalikes.

Owner actions:

- Add as New Find.
- Make Card Photo.
- Not This One.
- Save as Mystery.

DripDex should recommend the safest likely action:

- If the match is strong and the current default photo is good, recommend Add as New Find.
- If the new photo is clearer or more representative, recommend Make Card Photo.
- If confidence is messy, recommend review rather than pushing a destructive choice.

Add as New Find:

- Adds the observation to the existing creature.
- Adds the photo to the creature carousel.
- Increments seen count.
- Attaches variant or life-stage tags to the observation.
- Keeps exact GPS private.
- Uses protected public location.
- Evaluates celebration hooks.

Make Card Photo:

- Performs Add as New Find.
- Sets the new photo as the default card image.
- Keeps the previous default photo in the carousel and observation history.

Not This One:

- Opens the Refine ID path.
- Stores the rejected existing entry in the audit trail.
- Prevents the same match from being immediately suggested again unless the owner asks for it.

Save as Mystery:

- Creates or updates a mystery entry.
- Preserves rejected match, candidate list, notes, subject point, and model boxes.
- Makes the draft searchable by Mystery status.

If the new photo becomes the default, the previous default remains available in the gallery and observation history.

Create Separate Entry should be available only behind a lower-emphasis "More Options" path. Duplicate species entries will make the collection harder to understand, so the default flow should prefer adding a new observation or refining the ID.

## 8. Manage Creature Entries

Owners need a simple way to clean up, correct, enrich, publish, or hide creature entries so the collection stays accurate and fun.

Entry points:

- Creature detail page: `Edit Entry`.
- Capture success state: `Review Entry`.
- Existing-entry match flow after `Add as New Find` or `Make Card Photo`.
- Mystery resolution: `Promote to Creature`.
- Owner collection card overflow/menu can be added later if needed.

Editable MVP fields:

- Common name.
- Scientific name.
- Generated nickname.
- Default card photo.
- Public/private publish status.
- Category group: Bird, Mammal, Reptile, Amphibian, Fish, Insect, Arachnid, Other Invertebrate, Plant, Fungi.
- Type, food-chain, habitat/behavior, seasonality, variant/life-stage, and safety tags.
- Kid flavor text.
- Rarity/frame treatment.
- Location privacy mode.

Adult science facts and citations should be reviewable/editable, but the MVP UI should stay simple. Set membership can be added after the entity cache and set-generation work are in place unless it falls out naturally.

Editing UX:

- Use owner-only edit mode on the creature detail page.
- Keep the public creature card readable; do not turn the main public page into a giant form.
- Group edit controls into sections such as Identity, Photos, Tags, Safety, Flavor Text, Science & Sources, Privacy, and Sets.
- Every text input should use lookahead/autocomplete where possible.
- Tag editing should use selectable chips, not freeform typing.
- AI suggestions should appear as "Suggested" chips/text with owner approval.
- Autosave private fields when low-risk, but require explicit `Publish Update` for public-facing changes.

Photo management:

- Owner can view all photos/finds for a creature.
- Owner can choose the default card photo.
- Owner can add an alternate photo to the carousel.
- Owner can remove a public photo from display without deleting the private original.
- Owner can mark a photo's variant or life-stage.
- Owner can compare current default versus new photo side by side when replacing the default.
- Owner can crop any creature photo to the required card image aspect ratio.
- Crop UI should support zoom and pan so the subject can be centered without changing the original.
- Crop is non-destructive: store crop metadata and/or generate a public derivative while leaving the private original unchanged.
- Image derivatives should support original private image, public EXIF-stripped image, card-crop derivative, and thumbnail derivative.

Publishing rules:

- Creature entry statuses: Draft, Published, Hidden, Mystery, Needs Review.
- Public visitors see only Published entries plus public locked checklist cards.
- Draft, Hidden, and Needs Review are owner-only.
- Mystery defaults private until the owner explicitly publishes it.
- Sensitive location rules can block or modify publish behavior.

AI assist:

- AI can suggest tags, safety labels, rarity inputs, flavor text, science facts, lookalikes, and set candidates.
- AI cannot publish changes directly.
- AI-generated facts require citations before appearing in adult science sections.
- Owner can accept, edit, reject, or regenerate AI suggestions.

Validation rules:

- Common name is required for Published.
- Category is required for Published.
- At least one public-safe image or mystery placeholder is required for Published.
- Location privacy mode is required for any observation with location.
- Public image must be EXIF-stripped.
- Adult science facts should warn when source references are missing before publishing.
- Sensitive safety labels should be owner-confirmed before publishing.

## 9. Mystery Entries and Investigation

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

Public mysteries:

- Mysteries default private.
- Owner can explicitly publish a mystery using the grayscale/question-mark treatment.
- Owner can enable viewer suggestions for a published mystery.
- Viewer suggestion form should be simple: suggested name or ID, optional note, optional visitor name, and submit.
- Suggestions require owner review and do not directly change the mystery identity.
- The submitter can see a pending state similar to the guestbook behavior.
- Owner can promote a useful suggestion into a candidate ID in the mystery investigation workspace.

## 10. Public Browsing Experience

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

### Regional Checklist Cards

The collection/search view should be prepopulated with a curated Texas Hill Country checklist so the experience feels like a collectible regional field guide before the owner has many observations.

Checklist behavior:

- Seed common regional creatures by category and type.
- Show unfound creatures as disabled or locked cards with a high-contrast lock icon placeholder image.
- Number seeded checklist cards alphabetically so kids have a stable, achievable list to complete.
- Keep found and unfound cards in the same collection surface, with clear visual difference between found, locked, draft, mystery, and published states.
- Append any confirmed creature outside the seeded checklist using the next available number, and increment the total possible collection count. Example: a new confirmed unseeded species after a 75-card checklist becomes `#076`, and progress changes from `18/75` to `19/76`.
- Use the collection flavor phrase "Gotta Catch'em Y'all!" where it fits the playful checklist experience.

The seed list should be curated from reputable regional sources and human-reviewed. AI can suggest additions, aliases, tags, and starter descriptions, but it should not be the sole source of the checklist.

Collectible progress behavior:

- A creature counts as Found when it has at least one confirmed observation.
- Drafts do not count as Found.
- Mysteries do not count as Found until resolved.
- Locked checklist cards count toward the total possible collection.
- Rarity is a visual frame treatment, not a progress mechanic.
- The New badge clears when the card is opened. For public visitors this can be local browser state in MVP.
- Favorites are a simple personalization layer and do not affect progress.

Starter set catalog:

- Life-cycle sets: frog egg/tadpole/froglet/adult and butterfly egg/caterpillar/chrysalis/adult.
- Theme sets: Porch Light Crew, Pond Pals, Cacti Comrades, Succulent Set.
- Each set should have simple metadata: name, description, category, required entries, optional entries, completion rule, and celebration copy.
- AI can suggest set membership, but owner approval is required.
- Set wrappers should render when at least two related cards/finds are present, and completion should be highlighted when all required entries are found.

Set research and generation should be data-first:

1. Build the Hill Country entity cache first, including common species, category, habitats, seasonality, tags, safety labels, food-chain roles, observation contexts, and citations.
2. Use structured queries to discover candidate groupings from the cache rather than asking an LLM to invent sets from a loose theme.
3. Generate candidate sets from dimensions such as habitat, location context, behavior, life cycle, food-chain role, seasonality, and plant community.
4. Use AI only after the structured query step to suggest names, kid descriptions, and adult notes for candidate sets.
5. Require owner approval before a generated set becomes part of the public collection.
6. Research and cite each approved set after the candidate set is selected, not before.

### Collection View Visual Decisions

The approved collection-view direction is Option A, Scanner Grid, from `/docs/mockups/collection-view-options.html`.

Design decisions from the mockup:

- Keep search primary and always visible.
- Put most filters behind a compact Filter dropdown or mobile sheet rather than a long chip row.
- Allow only a small set of high-use quick filters, such as Found, Favorites, Drafts, and Mysteries.
- Add a Front Row Favorites area above the grouped collection when favorites exist. Starred cards still remain in their normal category group; Front Row is a shortcut, not relocation.
- Favorite state should be local/private in MVP: per-browser for public visitors and per-owner account for the logged-in owner. No public favorite counts in MVP.
- Group cards by broad organism category so the collection stays scannable as it grows.
- Use collapsible category sections for Birds, Mammals, Reptiles, Amphibians, Fish, Insects, Arachnids, Other Invertebrates, Plants, and Fungi.
- Include a compact category jump menu for long collections. It should be treated as lightweight navigation and kept visually small.
- Treat Draft cards with a red diagonal rubber-stamp overlay.
- Treat Mystery cards with the original image shown in grayscale, question marks for the name, and a purple question mark overlay on the image.
- Treat locked checklist cards with a lock icon, not a question mark, so locked/unfound and mystery/unknown states stay visually distinct.
- Treat New as a badge overlay that remains until the card is opened.
- Render complete life-cycle or connected sets inside a wrapper with an outline and colored background to show the cards belong together.
- Use the set wrapper especially when a set is complete, focused, or newly celebrated, rather than wrapping every possible relationship all the time.

Approved public collection states:

1. Public default: intro panel visible, guestbook collapsed, collection grid visible below. Reference: `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-public-default.png`.
2. Guestbook open: accordion expands in place between the intro and collection, with Name, Visiting From, Comment, Sign Guest Book, existing approved entries, and pagination. Reference: `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-guestbook-open.png`.
3. Guestbook pending submission: after submit, the visitor's row appears immediately at the top of the list with a Pending badge and owner-approval note. Reference: `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-guestbook-pending.png`.
4. Intro hidden: Hide Intro is the primary/default intro CTA; it dismisses the intro and stores that preference in a cookie so returning visitors land closer to the collection. Reference: `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-intro-hidden.png`.
5. Favorites and grouped collection: Front Row favorites, category jump menu, collapsible organism groups, and Featured Sets in the approved Option A visual language. Reference: `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-favorites-groups.png`.

Public intro behavior:

- The intro explains DripDex as a personal Hill Country field journal and open-source project.
- Primary CTA: Hide Intro.
- Secondary CTA: "Would you like to learn more?", linking to the project documentation site/GitHub Pages.
- The public collection should still be usable with the intro visible, hidden, or permanently dismissed.

Guestbook behavior:

- The guestbook is an in-page accordion, closed by default.
- The closed accordion is fully clickable and visually separate from the collection area.
- Right-handed mobile reach matters: the open/submit affordances should be visually and physically biased to the right side where practical.
- Guestbook submissions are public-facing only after owner approval, but the submitting visitor sees the new row immediately with Pending status.
- Pagination starts after 50 approved entries.

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

## 11. Creature Detail Experience

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

Hero media behavior:

- Tapping the hero photo opens a full-screen media viewer.
- The full-screen viewer supports pinch zoom.
- The full-screen viewer supports swipe left/right carousel navigation across finds/photos.
- The full-screen viewer has an obvious close button.
- The full-screen viewer supports swipe-down or return-intent closing when the image is not zoomed in.
- When the image is zoomed in, drag gestures pan the image first. Carousel and close gestures should only take over again when the zoom is near the default scale.

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

## 12. Tags, Rarity, and Game Flavor

### Tag Families

The app should use controlled tag lists that cover most organisms, with AI suggestions and owner approval.

Tag display should be compact by default. On creature cards and scan/detail surfaces, show tag families as icon + word controls. When a user taps a family, expand that family into readable pills. Icons may begin as emoji placeholders in prototypes but should later become consistent custom icons.

MVP tag families:

- Core type tags: Plant, Flying, Bug, Water, Ground, Rock, Poisonous, Venomous, Dark, Light, Camouflage, Armored, Singing, Stinging.
- Food-chain role tags: Producer, Pollinator, Herbivore, Carnivore, Omnivore, Predator, Prey, Decomposer, Scavenger, Parasite, Seed Spreader.
- Habitat/behavior tags: Woodland, Grassland, Creekside, Pond, Garden, Urban, Porch Light, Roadside, Cave, Burrowing, Climbing, Swimming, Web Builder, Migratory, Native, Introduced, Invasive, Rain-Loving, Drought-Tolerant.
- Seasonality tags: Spring, Summer, Fall, Winter, Year-Round.
- Variant/life-stage tags: Male, Female, Juvenile, Adult, Egg, Larva, Nymph, Pupa, Track, Call, Nest, Burrow, Scat, Flower, Bud, Fruit, Seed, New Growth, Dormant, Fruiting Body, Mycelium, Bracket, Lichen Form.
- Safety/interaction tags: Safe to Watch, Do Not Handle, Venomous, Poisonous, Irritates Skin, Stings, Bites, Sharp or Spines, Allergy Risk, Disease Risk, Fragile, Protected, Invasive Concern, Reportable.

Avoid public kid-facing Edible or Medicinal tags in MVP because they can encourage unsafe experimentation.

The final controlled lists should be broad enough for most entries but small enough to avoid tag sprawl.

Safety label rules:

- "Look, Don't Touch" is the global app safety rule shown at launch and in field-safety reminders. It should not be repeated as a creature-specific tag.
- "Safe to Watch" is the low-risk creature-specific label.
- "Do Not Handle" is the creature-specific warning for organisms where touching, grabbing, collecting, or disturbing increases risk.
- "Venomous" means a toxin can be delivered by bite or sting.
- "Poisonous" means a toxin can harm through eating, touching, inhaling, or absorption.
- "Irritates Skin" should be used for organisms or plants that commonly cause rash, itching, or contact irritation.
- "Strong Odor" can be a fun field note, but should not be treated as a safety warning unless a cited source links it to irritation or illness.

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

## 13. Facts and Citations

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

## 14. Tech Stack Direction

### Recommended First Build

Build a mobile-first web app/PWA first, with clean API boundaries for future native clients.

Recommended stack:

- Next.js App Router for public web/PWA.
- TypeScript across the app.
- SQLite for the open-source single-owner edition.
- Postgres with PostGIS for the managed SaaS and advanced multi-user installs.
- Supabase as the likely managed SaaS provider for auth, database, storage, and Row Level Security.
- Provider adapters so Supabase can be swapped or self-hosted alternatives can be used.
- Object storage for originals and public derivatives.
- Server-side image processing for EXIF stripping and resizing.
- Gemini-first LLM provider interface for identification, bounding boxes, and fact generation.
- Search provider interface for comparison thumbnails.

### Project Documentation Site

The project should include a GitHub Pages branch or published docs site linked from the public intro panel. It should explain what DripDex is, show the approved mockups, describe the open-source/self-host path, and give a lightweight "build your own DripDex" guide for parents, teachers, and local nature clubs.

### Native App Future

Future Android/iOS should be treated as another client of the same backend/API.

Likely future path:

- Expo/React Native for native apps.
- Shared TypeScript types and validation schemas.
- Shared API client.
- Shared domain logic where practical.

Do not over-optimize v1 around native UI reuse. Prioritize public web discoverability, mobile ergonomics, and clean APIs.

### Future OSS Community Directory

Not for MVP, but DripDex should consider an OSS community directory and webring-style link component.

Future concept:

- Public directory where owners can list their DripDex sites.
- Optional site component with Previous DripDex, Random DripDex, Next DripDex, and Join the DripDex ring links.
- Simple self-submitted metadata such as site name, region, owner display name, public URL, categories, short description, and last updated date.
- Works for OSS/self-hosted users, teachers, families, nature clubs, and local communities without requiring paid SaaS.

This should stay outside the MVP until the core personal field journal works.

## 15. MVP Jobs To Be Done

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

## 16. MVP User Journeys To Be Discussed Next

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

## 17. Open Design Questions

Questions remaining before implementation planning:

- Which journeys are required for v1 versus later?
- What is the exact default public geoprivacy cell size and home-zone policy?
- Which search provider should supply comparison thumbnails?
- How much citation generation is automated in v1?
- What moderation or review is required before public changes appear, given the single-owner model?
- What visual style should be used for the Pokédex-inspired shell while avoiding direct copying of protected Pokémon assets?

## 18. Source References Captured So Far

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
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-options.html`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-option-1.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-options-desktop.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-options-mobile.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-public-default.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-guestbook-open.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-guestbook-pending.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-intro-hidden.png`
- `/Users/clarkdever/Documents/code/pokedex/docs/mockups/collection-view-favorites-groups.png`

Gemini references:

- `https://ai.google.dev/gemini-api/docs/image-understanding`
- `https://ai.google.dev/gemini-api/docs/structured-output`
- `https://ai.google.dev/gemini-api/docs/streaming`

External references to revisit during planning:

- iNaturalist geoprivacy: https://www.inaturalist.org/pages/geoprivacy
- iNaturalist help on obscured observations: https://help.inaturalist.org/
- iNaturalist API reference: https://www.inaturalist.org/pages/api+reference
- iNaturalist observation API notes: https://www.inaturalist.org/pages/api+deprecated
- iNaturalist CSV import discussion/reference: https://forum.inaturalist.org/t/csv-import-observations-page/65768
- iNaturalist terms: https://www.inaturalist.org/pages/terms
- GBIF sensitive species best practices: https://docs.gbif.org/sensitive-species-best-practices/
- National Park Service poisonous vs. venomous explainer: https://www.nps.gov/cabr/blogs/venomous-versus-poisonous-same-thing-right-wrong.htm
- CDC/NIOSH poisonous plants guidance: https://www.cdc.gov/niosh/outdoor-workers/about/poisonous-plants.html
- Poison Control plant safety reference: https://www.poison.org/articles/plant
- Texas Parks and Wildlife bites and stings guidance: https://tpwd.texas.gov/education/hunter-education/online-course/preparation-and-survival/bites-and-stings
- GBIF data quality recommendations: https://techdocs.gbif.org/en/data-publishing/data-quality-recommendations
- NatureServe conservation status categories: https://www.natureserve.org/nsexplorer/about-the-data/statuses/conservation-status-categories
- Texas Parks and Wildlife rare species by county: https://tpwd.texas.gov/gis/rtest/
- Texas Parks and Wildlife listed species: https://tpwd.texas.gov/wildlife/wildlife-diversity/nongame/listed-species/
- Next.js App Router docs: https://nextjs.org/docs/app
- Expo web support: https://docs.expo.dev/workflow/web/
- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase self-hosting docs: https://supabase.com/docs/guides/self-hosting
- Vercel Hobby plan docs: https://vercel.com/docs/plans/hobby
