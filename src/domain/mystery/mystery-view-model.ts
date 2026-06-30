import type { History } from "../fixtures/fixture-schemas";
import type { ResolvedFixtureCreature } from "../fixtures/fixture-repository";

export type MysteryCandidateSource =
  | "ai"
  | "owner"
  | "public_suggestion"
  | "ebird"
  | "bugguide"
  | "tpwd"
  | "natureserve"
  | "plant_database"
  | "other_source";

export type MysteryCandidateStatus = "suggested" | "likely" | "rejected" | "confirmed";

export type MysteryCandidate = {
  id: string;
  commonName: string;
  scientificName: string | null;
  source: MysteryCandidateSource;
  status: MysteryCandidateStatus;
  notes: string;
  sourceLinks: readonly {
    label: string;
    url: string;
  }[];
};

export type MysteryWorkspaceViewId =
  | "detail"
  | "external_handoff"
  | "paste_normalize"
  | "resolve_candidate";

export type MysteryWorkspaceViewModel = {
  kind: "mystery-workspace";
  mysteryId: string;
  title: string;
  status: "needs_id" | "likely" | "confirmed";
  navigation: readonly {
    id: MysteryWorkspaceViewId;
    label: string;
  }[];
  views: {
    detail: MysteryDetailView;
    externalHandoff: MysteryExternalHandoffView;
    pasteNormalize: MysteryPasteNormalizeView;
    resolveCandidate: MysteryResolveCandidateView;
  };
};

export type MysteryDetailView = {
  photo: {
    id: string;
    files: ResolvedFixtureCreature["defaultPhoto"]["files"];
    altText: string;
    grayscaleByDefault: true;
  };
  privacyState: {
    publicVisibility: ResolvedFixtureCreature["creature"]["publicVisibility"];
    locationPrivacy: ResolvedFixtureCreature["observations"][number]["locationPrivacy"];
    publicMystery: boolean;
  };
  knownClues: {
    observedAt: string | null;
    publicLocationLabel: string;
    exactLocation: ResolvedFixtureCreature["observations"][number]["exactLocation"];
    notes: string;
  };
  candidateHistory: readonly MysteryCandidate[];
  actions: readonly {
    id: "add_candidate" | "ask_ai_again" | "mark_likely" | "confirm_id" | "keep_mystery";
    label: string;
  }[];
};

export type MysteryExternalHandoffView = {
  promptPreview: string;
  downloadPhoto: {
    action: "download_analysis_copy";
    file: string;
    exifStripped: true;
    source: "public_derivative";
  };
};

export type MysteryPasteNormalizeView = {
  pastePlaceholder: string;
  actions: readonly {
    id: "normalize_with_ai" | "clear_paste";
    label: string;
  }[];
};

export type MysteryResolveCandidateView = {
  activeCandidate: MysteryCandidate | null;
  actions: readonly MysteryResolutionAction[];
};

export type MysteryResolutionAction =
  | {
      id: "log_to_existing_entry";
      label: string;
      candidateId: string;
    }
  | {
      id: "create_duplicate_entry";
      label: string;
      candidateId: string;
    }
  | {
      id: "reject_suggestion";
      label: "Reject Suggestion";
      candidateId: string;
    };

export type BuildMysteryWorkspaceViewModelOptions = {
  candidateHistory?: readonly MysteryCandidate[];
  activeCandidateId?: string;
};

export type CreateRejectedMysterySuggestionHistoryEventOptions = {
  mysteryId: string;
  candidate: MysteryCandidate;
  rejectedAt: Date;
};

type HistoryEvent = History["events"][number];

const detailActions: MysteryDetailView["actions"] = [
  { id: "add_candidate", label: "Add Candidate" },
  { id: "ask_ai_again", label: "Ask AI Again" },
  { id: "mark_likely", label: "Mark Likely" },
  { id: "confirm_id", label: "Confirm ID" },
  { id: "keep_mystery", label: "Keep Mystery" }
];

const navigation: MysteryWorkspaceViewModel["navigation"] = [
  { id: "detail", label: "Detail" },
  { id: "external_handoff", label: "Prompt" },
  { id: "paste_normalize", label: "Paste" },
  { id: "resolve_candidate", label: "Resolve" }
];

export function buildMysteryWorkspaceViewModel(
  record: ResolvedFixtureCreature,
  options: BuildMysteryWorkspaceViewModelOptions = {}
): MysteryWorkspaceViewModel {
  if (record.creature.status !== "mystery") {
    throw new Error("Mystery workspace requires a mystery fixture record.");
  }

  const observation = record.observations[0];
  if (!observation) {
    throw new Error("Mystery workspace requires at least one observation.");
  }

  const title = getDisplayName(record);
  const candidateHistory = [...(options.candidateHistory ?? [])];
  const activeCandidate = selectActiveCandidate(candidateHistory, options.activeCandidateId);

  return {
    kind: "mystery-workspace",
    mysteryId: record.creature.id,
    title,
    status: activeCandidate?.status === "likely" ? "likely" : "needs_id",
    navigation,
    views: {
      detail: {
        photo: {
          id: record.defaultPhoto.id,
          files: record.defaultPhoto.files,
          altText: title,
          grayscaleByDefault: true
        },
        privacyState: {
          publicVisibility: record.creature.publicVisibility,
          locationPrivacy: observation.locationPrivacy,
          publicMystery: record.creature.publicVisibility === "public"
        },
        knownClues: {
          observedAt: observation.observedAt,
          publicLocationLabel: observation.publicLocationLabel,
          exactLocation: observation.exactLocation,
          notes: observation.notes
        },
        candidateHistory,
        actions: detailActions
      },
      externalHandoff: {
        promptPreview: createPromptPreview({
          observation,
          candidateHistory
        }),
        downloadPhoto: {
          action: "download_analysis_copy",
          file: record.defaultPhoto.files.full,
          exifStripped: record.defaultPhoto.processing.webDerivativesExifStripped,
          source: "public_derivative"
        }
      },
      pasteNormalize: {
        pastePlaceholder:
          "Paste prose, JSON, bullets, or source notes. DripDex will normalize it before owner review.",
        actions: [
          { id: "normalize_with_ai", label: "Normalize with AI" },
          { id: "clear_paste", label: "Clear Paste" }
        ]
      },
      resolveCandidate: {
        activeCandidate,
        actions: activeCandidate ? createResolutionActions(activeCandidate) : []
      }
    }
  };
}

export function createRejectedMysterySuggestionHistoryEvent(
  options: CreateRejectedMysterySuggestionHistoryEventOptions
): HistoryEvent {
  return {
    id: `event-${options.mysteryId}-${options.candidate.id}-rejected`,
    type: "suggestion_rejected",
    date: toDateOnly(options.rejectedAt),
    label: `Rejected candidate: ${options.candidate.commonName}`,
    details: `Rejected ${options.candidate.source} suggestion ${options.candidate.id} for ${options.mysteryId}.`
  };
}

function createResolutionActions(candidate: MysteryCandidate): MysteryResolutionAction[] {
  return [
    {
      id: "log_to_existing_entry",
      label: `Log to ${candidate.commonName} Entry`,
      candidateId: candidate.id
    },
    {
      id: "create_duplicate_entry",
      label: `Create Duplicate ${candidate.commonName} Entry`,
      candidateId: candidate.id
    },
    {
      id: "reject_suggestion",
      label: "Reject Suggestion",
      candidateId: candidate.id
    }
  ];
}

function selectActiveCandidate(
  candidateHistory: readonly MysteryCandidate[],
  activeCandidateId: string | undefined
): MysteryCandidate | null {
  if (activeCandidateId) {
    return candidateHistory.find((candidate) => candidate.id === activeCandidateId) ?? null;
  }

  return (
    candidateHistory.find((candidate) => candidate.status === "likely") ??
    candidateHistory.find((candidate) => candidate.status === "suggested") ??
    null
  );
}

function createPromptPreview(options: {
  observation: ResolvedFixtureCreature["observations"][number];
  candidateHistory: readonly MysteryCandidate[];
}): string {
  const candidates = options.candidateHistory
    .map((candidate) => `${candidate.commonName} (${candidate.status})`)
    .join(", ");

  return [
    "Please inspect the attached EXIF-stripped photo first, then use these notes as supporting context.",
    `Context: ${options.observation.publicLocationLabel}.`,
    `Observation notes: ${options.observation.notes}`,
    candidates ? `Current candidate history: ${candidates}.` : "Current candidate history: none yet.",
    "Private coordinates and home-zone details are omitted by default.",
    "JSON is helpful but not required; DripDex will normalize the answer after paste."
  ].join("\n\n");
}

function getDisplayName(record: ResolvedFixtureCreature): string {
  return (
    record.creature.displayName.customName ??
    record.creature.displayName.generatedNickname ??
    record.creature.commonName
  );
}

function toDateOnly(date: Date): string {
  const time = date.getTime();
  if (!Number.isFinite(time)) {
    throw new Error("rejectedAt must be a valid Date.");
  }

  return date.toISOString().slice(0, 10);
}
