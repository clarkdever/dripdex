import { describe, expect, it } from "vitest";

import {
  applyCaptureDraftEvent,
  type CreateCaptureDraftOptions,
  createCaptureDraft,
  createInMemoryCaptureDraftRepository,
  getCaptureDraftSearchStatus
} from "./draft-state";

const now = new Date("2026-06-30T12:00:00.000Z");
const later = new Date("2026-06-30T12:05:00.000Z");

describe("capture draft state machine", () => {
  it("creates private recoverable drafts immediately after photo or manual start", () => {
    const photoDraft = createCaptureDraft({
      id: "draft-photo-001",
      startedAt: now,
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-photo-001.jpg"
    });
    const manualDraft = createCaptureDraft({
      id: "draft-manual-001",
      startedAt: now,
      startMethod: "manual_observation"
    });

    expect(photoDraft).toMatchObject({
      id: "draft-photo-001",
      status: "draft",
      visibility: "private",
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-photo-001.jpg",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
    expect(manualDraft).toMatchObject({
      id: "draft-manual-001",
      status: "draft",
      visibility: "private",
      startMethod: "manual_observation",
      originalImageKey: null
    });
    expect(getCaptureDraftSearchStatus(photoDraft)).toBe("draft");
    expect(getCaptureDraftSearchStatus(manualDraft)).toBe("draft");
  });

  it("records EXIF, derivatives, subject tap, AI candidate, and owner decision events", () => {
    const initialDraft = createCaptureDraft({
      id: "draft-progressive-001",
      startedAt: now,
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-progressive-001.jpg"
    });

    const withExif = applyCaptureDraftEvent(initialDraft, {
      type: "exif_recorded",
      occurredAt: later,
      result: {
        status: "ok",
        capturedAtRaw: "2026:06:30 12:00:00",
        coordinates: {
          latitude: 30.444444,
          longitude: -98.222222
        },
        camera: {
          make: "Synthetic Camera",
          model: "Draft Fixture"
        }
      }
    });
    const withDerivatives = applyCaptureDraftEvent(withExif, {
      type: "derivatives_recorded",
      occurredAt: later,
      result: {
        status: "ok",
        fullKey: "public/draft-progressive-001-full.jpg",
        cardKey: "public/draft-progressive-001-card.jpg",
        thumbnailKey: "public/draft-progressive-001-thumb.jpg"
      }
    });
    const withSubjectTap = applyCaptureDraftEvent(withDerivatives, {
      type: "subject_tap_recorded",
      occurredAt: later,
      point: {
        x: 0.42,
        y: 0.58
      }
    });
    const withCandidate = applyCaptureDraftEvent(withSubjectTap, {
      type: "ai_candidate_recorded",
      occurredAt: later,
      candidate: {
        commonName: "Texas Spiny Lizard",
        scientificName: "Sceloporus olivaceus",
        confidence: "medium"
      }
    });
    const reviewed = applyCaptureDraftEvent(withCandidate, {
      type: "owner_decision_recorded",
      occurredAt: later,
      decision: {
        type: "accept_candidate",
        creatureId: "texas-spiny-lizard"
      }
    });

    expect(reviewed).toMatchObject({
      status: "draft",
      exif: {
        status: "ok",
        coordinates: {
          latitude: 30.444444,
          longitude: -98.222222
        },
        camera: {
          make: "Synthetic Camera",
          model: "Draft Fixture"
        }
      },
      derivatives: {
        status: "ok",
        cardKey: "public/draft-progressive-001-card.jpg"
      },
      subjectTap: {
        x: 0.42,
        y: 0.58
      },
      aiCandidate: {
        commonName: "Texas Spiny Lizard",
        confidence: "medium"
      },
      ownerDecision: {
        type: "accept_candidate",
        creatureId: "texas-spiny-lizard"
      },
      updatedAt: later.toISOString()
    });
    expect(reviewed.events.map((event) => event.type)).toEqual([
      "draft_created",
      "exif_recorded",
      "derivatives_recorded",
      "subject_tap_recorded",
      "ai_candidate_recorded",
      "owner_decision_recorded"
    ]);
  });

  it("keeps drafts visible when EXIF or AI processing fails", () => {
    const draft = createCaptureDraft({
      id: "draft-failure-001",
      startedAt: now,
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-failure-001.jpg"
    });
    const withExifFailure = applyCaptureDraftEvent(draft, {
      type: "exif_recorded",
      occurredAt: later,
      result: {
        status: "failed",
        coordinates: null,
        capturedAtRaw: null,
        camera: {
          make: "Synthetic Camera",
          model: "Draft Fixture"
        },
        error: {
          code: "invalid_exif",
          message: "Could not read image metadata."
        }
      }
    });
    const withAiFailure = applyCaptureDraftEvent(withExifFailure, {
      type: "ai_failed",
      occurredAt: later,
      error: {
        code: "provider_unavailable",
        message: "Identification is temporarily unavailable."
      }
    });

    expect(withAiFailure).toMatchObject({
      status: "draft",
      visibility: "private",
      exif: {
        status: "failed",
        error: {
          code: "invalid_exif",
          message: "Could not read image metadata."
        }
      },
      aiFailure: {
        error: {
          code: "provider_unavailable",
          message: "Identification is temporarily unavailable."
        }
      }
    });
    expect(getCaptureDraftSearchStatus(withAiFailure)).toBe("draft");
  });

  it("saves uncertain observations as searchable mysteries without losing draft context", () => {
    const draft = createCaptureDraft({
      id: "draft-mystery-001",
      startedAt: now,
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-mystery-001.jpg"
    });
    const withCandidate = applyCaptureDraftEvent(draft, {
      type: "ai_candidate_recorded",
      occurredAt: later,
      candidate: {
        commonName: "Unknown Shelf Fungus",
        scientificName: null,
        confidence: "low"
      }
    });
    const mystery = applyCaptureDraftEvent(withCandidate, {
      type: "mystery_saved",
      occurredAt: later,
      mysteryId: "mystery-white-shelf-fungus",
      ownerNote: "White shelf fungus on a fallen branch."
    });

    expect(mystery).toMatchObject({
      status: "mystery",
      visibility: "private",
      mystery: {
        mysteryId: "mystery-white-shelf-fungus",
        ownerNote: "White shelf fungus on a fallen branch."
      },
      aiCandidate: {
        commonName: "Unknown Shelf Fungus",
        confidence: "low"
      }
    });
    expect(getCaptureDraftSearchStatus(mystery)).toBe("mystery");
  });

  it("persists drafts and finds them by Draft or Mystery search status", async () => {
    const repository = createInMemoryCaptureDraftRepository();
    const draft = createCaptureDraft({
      id: "draft-search-001",
      startedAt: now,
      startMethod: "manual_observation"
    });
    const mystery = applyCaptureDraftEvent(
      createCaptureDraft({
        id: "draft-search-002",
        startedAt: now,
        startMethod: "photo_upload",
        originalImageKey: "private/originals/draft-search-002.jpg"
      }),
      {
        type: "mystery_saved",
        occurredAt: later,
        mysteryId: "mystery-search-002",
        ownerNote: "Needs ID later."
      }
    );

    await repository.save(draft);
    await repository.save(mystery);

    await expect(repository.getById("draft-search-001")).resolves.toEqual(draft);
    await expect(repository.listBySearchStatus("draft")).resolves.toEqual([draft]);
    await expect(repository.listBySearchStatus("mystery")).resolves.toEqual([mystery]);
  });

  it("rejects invalid start methods and event transitions", () => {
    expect(() =>
      createCaptureDraft({
        id: "draft-missing-image-001",
        startedAt: now,
        startMethod: "photo_upload"
      } as unknown as CreateCaptureDraftOptions)
    ).toThrow("originalImageKey is required for photo_upload drafts.");
    expect(() =>
      createCaptureDraft({
        id: "draft-manual-image-001",
        startedAt: now,
        startMethod: "manual_observation",
        originalImageKey: "private/originals/should-not-exist.jpg"
      } as unknown as CreateCaptureDraftOptions)
    ).toThrow("originalImageKey is only allowed for photo_upload or scanner_capture drafts.");

    const manualDraft = createCaptureDraft({
      id: "draft-manual-transition-001",
      startedAt: now,
      startMethod: "manual_observation"
    });
    expect(() =>
      applyCaptureDraftEvent(manualDraft, {
        type: "derivatives_recorded",
        occurredAt: later,
        result: {
          status: "ok",
          fullKey: "public/manual-full.jpg",
          cardKey: "public/manual-card.jpg",
          thumbnailKey: "public/manual-thumb.jpg"
        }
      })
    ).toThrow("derivatives_recorded requires a photo-backed draft.");

    expect(() =>
      applyCaptureDraftEvent(manualDraft, {
        type: "owner_decision_recorded",
        occurredAt: later,
        decision: {
          type: "accept_candidate",
          creatureId: "texas-spiny-lizard"
        }
      })
    ).toThrow("accept_candidate requires an AI candidate.");
  });

  it("keeps updatedAt monotonic when background events arrive out of order", () => {
    const draft = createCaptureDraft({
      id: "draft-out-of-order-001",
      startedAt: now,
      startMethod: "photo_upload",
      originalImageKey: "private/originals/draft-out-of-order-001.jpg"
    });
    const withNewerEvent = applyCaptureDraftEvent(draft, {
      type: "ai_candidate_recorded",
      occurredAt: new Date("2026-06-30T12:10:00.000Z"),
      candidate: {
        commonName: "Texas Spiny Lizard",
        scientificName: "Sceloporus olivaceus",
        confidence: "medium"
      }
    });
    const withOlderEvent = applyCaptureDraftEvent(withNewerEvent, {
      type: "exif_recorded",
      occurredAt: new Date("2026-06-30T12:03:00.000Z"),
      result: {
        status: "no_coordinates",
        coordinates: null,
        capturedAtRaw: "2026:06:30 12:00:00",
        camera: {
          make: "Synthetic Camera",
          model: "Draft Fixture"
        }
      }
    });

    expect(withOlderEvent.updatedAt).toBe("2026-06-30T12:10:00.000Z");
    expect(withOlderEvent.events.at(-1)).toMatchObject({
      type: "exif_recorded",
      occurredAt: "2026-06-30T12:03:00.000Z"
    });
  });
});
