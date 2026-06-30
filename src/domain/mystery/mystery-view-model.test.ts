import { describe, expect, it } from "vitest";

import { createFixtureRepository } from "../fixtures/fixture-repository";
import {
  buildMysteryWorkspaceViewModel,
  createRejectedMysterySuggestionHistoryEvent
} from "./mystery-view-model";

const repository = createFixtureRepository();
const mysteryRecord = repository.getCreatureById("mystery-white-shelf-fungus");

if (!mysteryRecord) {
  throw new Error("Expected mystery-white-shelf-fungus fixture");
}

const candidateHistory = [
  {
    id: "candidate-green-lacewing-001",
    commonName: "Green Lacewing",
    scientificName: "Chrysoperla rufilabris",
    source: "public_suggestion" as const,
    status: "likely" as const,
    notes: "Viewer suggestion. Not confirmed.",
    sourceLinks: []
  },
  {
    id: "candidate-small-green-moth-001",
    commonName: "Small green moth",
    scientificName: null,
    source: "ai" as const,
    status: "rejected" as const,
    notes: "AI suggestion rejected once. Still saved in history.",
    sourceLinks: [
      {
        label: "BugGuide moth reference",
        url: "https://bugguide.net/"
      }
    ]
  }
];

describe("mystery workspace view model", () => {
  it("builds the detail view with photo, known clues, candidate history, and actions", () => {
    const viewModel = buildMysteryWorkspaceViewModel(mysteryRecord, {
      candidateHistory
    });

    expect(viewModel).toMatchObject({
      kind: "mystery-workspace",
      mysteryId: "mystery-white-shelf-fungus",
      title: "Question Shelf",
      views: {
        detail: {
          photo: {
            id: "photo-mystery-white-shelf-fungus-001",
            grayscaleByDefault: true
          },
          privacyState: {
            publicVisibility: "public",
            locationPrivacy: "public_region_only",
            publicMystery: true
          },
          knownClues: {
            publicLocationLabel: "Texas Hill Country example fixture",
            exactLocation: null,
            notes: "OSS fixture generated from a public source page for UI and metadata contract testing."
          },
          candidateHistory,
          actions: [
            { id: "add_candidate", label: "Add Candidate" },
            { id: "ask_ai_again", label: "Ask AI Again" },
            { id: "mark_likely", label: "Mark Likely" },
            { id: "confirm_id", label: "Confirm ID" },
            { id: "keep_mystery", label: "Keep Mystery" }
          ]
        }
      }
    });
    expect(viewModel.navigation.map((item) => item.id)).toEqual([
      "detail",
      "external_handoff",
      "paste_normalize",
      "resolve_candidate"
    ]);
  });

  it("uses an EXIF-stripped analysis copy for external LLM handoff", () => {
    const viewModel = buildMysteryWorkspaceViewModel(mysteryRecord, {
      candidateHistory
    });

    expect(viewModel.views.externalHandoff.downloadPhoto).toEqual({
      action: "download_analysis_copy",
      file: "docs/fixtures/web-images/mystery-white-shelf-fungus-full.jpg",
      exifStripped: true,
      source: "public_derivative"
    });
    expect(viewModel.views.externalHandoff.downloadPhoto.file).not.toBe(
      "docs/fixtures/source-images/mystery-white-shelf-fungus.jpg"
    );
    expect(viewModel.views.externalHandoff.promptPreview).toContain(
      "Texas Hill Country example fixture"
    );
    expect(viewModel.views.externalHandoff.promptPreview).not.toContain("Exact GPS");
  });

  it("limits resolution CTAs to the approved owner decisions", () => {
    const viewModel = buildMysteryWorkspaceViewModel(mysteryRecord, {
      candidateHistory,
      activeCandidateId: "candidate-green-lacewing-001"
    });

    expect(viewModel.views.resolveCandidate.actions).toEqual([
      {
        id: "log_to_existing_entry",
        label: "Log to Green Lacewing Entry",
        candidateId: "candidate-green-lacewing-001"
      },
      {
        id: "create_duplicate_entry",
        label: "Create Duplicate Green Lacewing Entry",
        candidateId: "candidate-green-lacewing-001"
      },
      {
        id: "reject_suggestion",
        label: "Reject Suggestion",
        candidateId: "candidate-green-lacewing-001"
      }
    ]);
  });

  it("records rejected suggestions as mystery history events", () => {
    expect(
      createRejectedMysterySuggestionHistoryEvent({
        mysteryId: "mystery-white-shelf-fungus",
        candidate: candidateHistory[1],
        rejectedAt: new Date("2026-06-30T12:00:00.000Z")
      })
    ).toEqual({
      id: "event-mystery-white-shelf-fungus-candidate-small-green-moth-001-rejected",
      type: "suggestion_rejected",
      date: "2026-06-30",
      label: "Rejected candidate: Small green moth",
      details: "Rejected ai suggestion candidate-small-green-moth-001 for mystery-white-shelf-fungus."
    });
  });
});
