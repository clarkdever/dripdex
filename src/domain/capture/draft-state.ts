import type { ExifCamera, ExifCoordinates } from "../exif/exif-parser";

export type CaptureDraftStatus = "draft" | "mystery";
export type CaptureDraftSearchStatus = CaptureDraftStatus;
export type CaptureDraftVisibility = "private";
export type CaptureDraftStartMethod = "photo_upload" | "scanner_capture" | "manual_observation";

export type CaptureDraftProcessingError = {
  code:
    | "invalid_exif"
    | "partial_coordinates"
    | "provider_unavailable"
    | "provider_timeout"
    | "validation_failed"
    | "unknown";
  message: string;
};

export type CaptureDraftExifResult =
  | {
      status: "ok";
      coordinates: ExifCoordinates;
      capturedAtRaw: string | null;
      camera: ExifCamera;
    }
  | {
      status: "no_coordinates";
      coordinates: null;
      capturedAtRaw: string | null;
      camera: ExifCamera;
    }
  | {
      status: "partial_coordinates";
      coordinates: null;
      capturedAtRaw: string | null;
      camera: ExifCamera;
      missingGpsFields: string[];
      error: CaptureDraftProcessingError;
    }
  | {
      status: "invalid_exif" | "failed";
      coordinates: null;
      capturedAtRaw: null;
      camera: ExifCamera;
      error: CaptureDraftProcessingError;
    };

export type CaptureDraftDerivativeResult =
  | {
      status: "ok";
      fullKey: string;
      cardKey: string;
      thumbnailKey: string;
    }
  | {
      status: "failed";
      error: CaptureDraftProcessingError;
    };

export type NormalizedSubjectPoint = {
  x: number;
  y: number;
};

export type CaptureDraftAiCandidate = {
  commonName: string;
  scientificName: string | null;
  confidence: "high" | "medium" | "low";
};

export type CaptureDraftOwnerDecision =
  | {
      type: "accept_candidate";
      creatureId: string;
    }
  | {
      type: "manual_identification";
      commonName: string;
      scientificName: string | null;
    }
  | {
      type: "refine_candidate" | "reject_candidate";
      note: string;
    };

export type CaptureDraftMystery = {
  mysteryId: string;
  ownerNote: string;
};

export type CaptureDraftEvent =
  | {
      type: "draft_created";
      occurredAt: string;
      startMethod: CaptureDraftStartMethod;
    }
  | {
      type: "exif_recorded";
      occurredAt: string;
      result: CaptureDraftExifResult;
    }
  | {
      type: "derivatives_recorded";
      occurredAt: string;
      result: CaptureDraftDerivativeResult;
    }
  | {
      type: "subject_tap_recorded";
      occurredAt: string;
      point: NormalizedSubjectPoint;
    }
  | {
      type: "ai_candidate_recorded";
      occurredAt: string;
      candidate: CaptureDraftAiCandidate;
    }
  | {
      type: "ai_failed";
      occurredAt: string;
      error: CaptureDraftProcessingError;
    }
  | {
      type: "owner_decision_recorded";
      occurredAt: string;
      decision: CaptureDraftOwnerDecision;
    }
  | {
      type: "mystery_saved";
      occurredAt: string;
      mysteryId: string;
      ownerNote: string;
    };

type CaptureDraftRecordedEvent = Exclude<CaptureDraftEvent, { type: "draft_created" }>;

type DraftInputEvent<T extends { occurredAt: string }> = Omit<T, "occurredAt"> & {
  occurredAt: Date;
};

export type CaptureDraftInputEvent =
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "exif_recorded" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "derivatives_recorded" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "subject_tap_recorded" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "ai_candidate_recorded" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "ai_failed" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "owner_decision_recorded" }>>
  | DraftInputEvent<Extract<CaptureDraftEvent, { type: "mystery_saved" }>>;

export type CaptureDraft = {
  id: string;
  status: CaptureDraftStatus;
  visibility: CaptureDraftVisibility;
  startMethod: CaptureDraftStartMethod;
  originalImageKey: string | null;
  createdAt: string;
  updatedAt: string;
  exif: CaptureDraftExifResult | null;
  derivatives: CaptureDraftDerivativeResult | null;
  subjectTap: NormalizedSubjectPoint | null;
  aiCandidate: CaptureDraftAiCandidate | null;
  aiFailure: { error: CaptureDraftProcessingError; occurredAt: string } | null;
  ownerDecision: CaptureDraftOwnerDecision | null;
  mystery: CaptureDraftMystery | null;
  events: CaptureDraftEvent[];
};

export type CreateCaptureDraftOptions =
  | {
      id: string;
      startedAt: Date;
      startMethod: "photo_upload" | "scanner_capture";
      originalImageKey: string;
    }
  | {
      id: string;
      startedAt: Date;
      startMethod: "manual_observation";
      originalImageKey?: never;
    };

export type CaptureDraftRepository = {
  save(draft: CaptureDraft): Promise<void>;
  getById(id: string): Promise<CaptureDraft | null>;
  listBySearchStatus(status: CaptureDraftSearchStatus): Promise<CaptureDraft[]>;
};

export function createCaptureDraft(options: CreateCaptureDraftOptions): CaptureDraft {
  assertNonEmpty(options.id, "id");
  const startMethod: CaptureDraftStartMethod = options.startMethod;
  const originalImageKey = "originalImageKey" in options ? options.originalImageKey : undefined;

  if (startMethod === "manual_observation" && originalImageKey !== undefined) {
    throw new Error("originalImageKey is only allowed for photo_upload or scanner_capture drafts.");
  }
  if (startMethod !== "manual_observation" && originalImageKey === undefined) {
    throw new Error(`originalImageKey is required for ${startMethod} drafts.`);
  }
  if (originalImageKey !== undefined) {
    assertNonEmpty(originalImageKey, "originalImageKey");
  }

  const occurredAt = toIsoString(options.startedAt, "startedAt");

  return {
    id: options.id,
    status: "draft",
    visibility: "private",
    startMethod,
    originalImageKey: startMethod === "manual_observation" ? null : originalImageKey!,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    exif: null,
    derivatives: null,
    subjectTap: null,
    aiCandidate: null,
    aiFailure: null,
    ownerDecision: null,
    mystery: null,
    events: [
      {
        type: "draft_created",
        occurredAt,
        startMethod
      }
    ]
  };
}

export function applyCaptureDraftEvent(
  draft: CaptureDraft,
  event: CaptureDraftInputEvent
): CaptureDraft {
  const occurredAt = toIsoString(event.occurredAt, "occurredAt");
  const normalizedEvent = normalizeInputEvent(event, occurredAt);
  assertValidTransition(draft, normalizedEvent);
  const baseDraft = {
    ...draft,
    updatedAt: maxIsoString(draft.updatedAt, occurredAt),
    events: [...draft.events, normalizedEvent]
  };

  switch (normalizedEvent.type) {
    case "exif_recorded":
      return {
        ...baseDraft,
        exif: normalizedEvent.result
      };
    case "derivatives_recorded":
      return {
        ...baseDraft,
        derivatives: normalizedEvent.result
      };
    case "subject_tap_recorded":
      assertNormalizedPoint(normalizedEvent.point);
      return {
        ...baseDraft,
        subjectTap: normalizedEvent.point
      };
    case "ai_candidate_recorded":
      return {
        ...baseDraft,
        aiCandidate: normalizedEvent.candidate,
        aiFailure: null
      };
    case "ai_failed":
      return {
        ...baseDraft,
        aiFailure: {
          error: normalizedEvent.error,
          occurredAt
        }
      };
    case "owner_decision_recorded":
      return {
        ...baseDraft,
        ownerDecision: normalizedEvent.decision
      };
    case "mystery_saved":
      return {
        ...baseDraft,
        status: "mystery",
        mystery: {
          mysteryId: normalizedEvent.mysteryId,
          ownerNote: normalizedEvent.ownerNote
        }
      };
  }
}

export function getCaptureDraftSearchStatus(
  draft: Pick<CaptureDraft, "status">
): CaptureDraftSearchStatus {
  return draft.status === "mystery" ? "mystery" : "draft";
}

export function createInMemoryCaptureDraftRepository(): CaptureDraftRepository {
  const draftsById = new Map<string, CaptureDraft>();

  return {
    async save(draft) {
      draftsById.set(draft.id, cloneDraft(draft));
    },
    async getById(id) {
      const draft = draftsById.get(id);

      return draft ? cloneDraft(draft) : null;
    },
    async listBySearchStatus(status) {
      return [...draftsById.values()]
        .filter((draft) => getCaptureDraftSearchStatus(draft) === status)
        .map(cloneDraft);
    }
  };
}

function normalizeInputEvent(
  event: CaptureDraftInputEvent,
  occurredAt: string
): CaptureDraftRecordedEvent {
  switch (event.type) {
    case "exif_recorded":
      return { type: event.type, occurredAt, result: event.result };
    case "derivatives_recorded":
      return { type: event.type, occurredAt, result: event.result };
    case "subject_tap_recorded":
      return { type: event.type, occurredAt, point: event.point };
    case "ai_candidate_recorded":
      return { type: event.type, occurredAt, candidate: event.candidate };
    case "ai_failed":
      assertProcessingError(event.error);
      return { type: event.type, occurredAt, error: event.error };
    case "owner_decision_recorded":
      return { type: event.type, occurredAt, decision: event.decision };
    case "mystery_saved":
      assertNonEmpty(event.mysteryId, "mysteryId");
      return {
        type: event.type,
        occurredAt,
        mysteryId: event.mysteryId,
        ownerNote: event.ownerNote
      };
  }
}

function assertValidTransition(draft: CaptureDraft, event: CaptureDraftRecordedEvent): void {
  if (
    (event.type === "exif_recorded" ||
      event.type === "derivatives_recorded" ||
      event.type === "subject_tap_recorded") &&
    !draft.originalImageKey
  ) {
    throw new Error(`${event.type} requires a photo-backed draft.`);
  }

  if (event.type === "owner_decision_recorded" && event.decision.type === "accept_candidate") {
    assertNonEmpty(event.decision.creatureId, "creatureId");
    if (!draft.aiCandidate) {
      throw new Error("accept_candidate requires an AI candidate.");
    }
  }
}

function assertProcessingError(error: CaptureDraftProcessingError): void {
  assertNonEmpty(error.code, "error.code");
  assertNonEmpty(error.message, "error.message");
}

function assertNormalizedPoint(point: NormalizedSubjectPoint): void {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x > 1 ||
    point.y < 0 ||
    point.y > 1
  ) {
    throw new Error("Subject tap point must use normalized x/y values from 0 to 1.");
  }
}

function assertNonEmpty(value: string, name: string): void {
  if (!value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
}

function toIsoString(value: Date, name: string): string {
  const timestamp = value.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${name} must be a valid Date.`);
  }

  return value.toISOString();
}

function maxIsoString(first: string, second: string): string {
  return first > second ? first : second;
}

function cloneDraft(draft: CaptureDraft): CaptureDraft {
  return structuredClone(draft);
}
