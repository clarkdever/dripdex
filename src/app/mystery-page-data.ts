import {
  buildMysteryWorkspaceViewModel,
  type MysteryCandidate,
  type MysteryWorkspaceViewModel
} from "../domain/mystery/mystery-view-model";

import { createFixtureRecords } from "./collection-page-data";

type FixtureRecords = ReturnType<typeof createFixtureRecords>;

type PublicMysteryDetailView = Omit<
  MysteryWorkspaceViewModel["views"]["detail"],
  "knownClues"
> & {
  knownClues: Omit<
    MysteryWorkspaceViewModel["views"]["detail"]["knownClues"],
    "exactLocation"
  >;
};

export type PublicMysteryWorkspaceViewModel = Omit<MysteryWorkspaceViewModel, "views"> & {
  views: Omit<MysteryWorkspaceViewModel["views"], "detail"> & {
    detail: PublicMysteryDetailView;
  };
};

const fixtureCandidateHistory = [
  {
    id: "candidate-green-lacewing-001",
    commonName: "Green Lacewing",
    scientificName: "Chrysoperla rufilabris",
    source: "public_suggestion",
    status: "likely",
    notes: "Viewer suggestion. Not confirmed.",
    sourceLinks: []
  },
  {
    id: "candidate-small-green-moth-001",
    commonName: "Small green moth",
    scientificName: null,
    source: "ai",
    status: "rejected",
    notes: "AI suggestion rejected once. Still saved in history.",
    sourceLinks: [
      {
        label: "BugGuide moth reference",
        url: "https://bugguide.net/"
      }
    ]
  }
] as const satisfies readonly MysteryCandidate[];

export function createMysteryWorkspacePageViewModel(
  id: string,
  records: FixtureRecords = createFixtureRecords()
) {
  const record = records.find((candidate) => candidate.creature.id === id);

  if (
    !record ||
    record.creature.status !== "mystery" ||
    record.creature.publicVisibility !== "public"
  ) {
    return null;
  }

  return toPublicMysteryWorkspaceViewModel(
    buildMysteryWorkspaceViewModel(record, {
      candidateHistory: fixtureCandidateHistory,
      activeCandidateId: "candidate-green-lacewing-001"
    })
  );
}

export function toPublicMysteryWorkspaceViewModel(
  viewModel: MysteryWorkspaceViewModel
): PublicMysteryWorkspaceViewModel {
  const detail = viewModel.views.detail;

  return {
    ...viewModel,
    views: {
      ...viewModel.views,
      detail: {
        ...detail,
        knownClues: {
          observedAt: detail.knownClues.observedAt,
          publicLocationLabel: detail.knownClues.publicLocationLabel,
          notes: detail.knownClues.notes
        }
      }
    }
  };
}
