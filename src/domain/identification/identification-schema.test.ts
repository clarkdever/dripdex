import { describe, expect, it } from "vitest";

import { identificationResultSchema } from "./identification-schema";

const validIdentificationResult = {
  schemaVersion: "dripdex.identification-result.v1",
  provider: {
    id: "mock-gemini",
    model: "gemini-test-model"
  },
  subjectRegions: [
    {
      regionId: "region-winged-insect-001",
      label: "winged insect",
      confidence: 0.82,
      sourceModel: "gemini-test-model",
      box: {
        x: 0.14,
        y: 0.2,
        width: 0.42,
        height: 0.36
      }
    }
  ],
  identityCandidates: [
    {
      candidateId: "candidate-green-lacewing-001",
      commonName: "Green Lacewing",
      scientificName: "Chrysoperla rufilabris",
      confidence: 0.74,
      reasoningForOwner:
        "The pale green body and wing shape match a green lacewing more closely than a moth.",
      lookalikes: ["Brown Lacewing", "Small green moth"]
    },
    {
      candidateId: "candidate-small-moth-001",
      commonName: "Small green moth",
      scientificName: null,
      confidence: 0.31,
      reasoningForOwner: "The photo is blurry enough that a small moth remains possible.",
      lookalikes: ["Green Lacewing"]
    }
  ],
  suggestedCategory: "insect",
  suggestedTags: {
    typeTags: ["Bug", "Flying", "Light"],
    foodChainTags: ["Predator", "Pollinator"],
    seasonality: ["Summer"],
    safetyLabels: ["Do Not Touch"]
  },
  safetyNote: "Look closely, but avoid handling until an owner confirms the ID.",
  uncertaintyFlags: ["blurry_photo", "lookalike_species"],
  citations: [
    {
      label: "BugGuide green lacewing reference",
      url: "https://bugguide.net/"
    }
  ],
  notes: "Needs owner confirmation from photo details."
};

describe("identification result schema", () => {
  it("accepts multiple identity candidates with normalized subject boxes", () => {
    const result = identificationResultSchema.safeParse(validIdentificationResult);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected valid identification result fixture to parse");
    }

    expect(result.data.identityCandidates).toHaveLength(2);
    expect(result.data.subjectRegions[0]?.box).toEqual({
      x: 0.14,
      y: 0.2,
      width: 0.42,
      height: 0.36
    });
  });

  it("rejects malformed normalized bounding boxes", () => {
    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        subjectRegions: [
          {
            ...validIdentificationResult.subjectRegions[0],
            box: {
              x: 0.8,
              y: 0.2,
              width: 0.3,
              height: 0.36
            }
          }
        ]
      }).success
    ).toBe(false);

    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        subjectRegions: [
          {
            ...validIdentificationResult.subjectRegions[0],
            box: {
              x: -0.1,
              y: 0.2,
              width: 0.3,
              height: 0.36
            }
          }
        ]
      }).success
    ).toBe(false);
  });

  it("rejects malformed software inputs instead of passing raw model output through", () => {
    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        rawModelText: "probably a lacewing",
        identityCandidates: [
          {
            ...validIdentificationResult.identityCandidates[0],
            confidence: "pretty sure"
          }
        ]
      }).success
    ).toBe(false);

    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        identityCandidates: []
      }).success
    ).toBe(false);
  });

  it("rejects tag and safety suggestions outside the existing controlled families", () => {
    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        suggestedTags: {
          ...validIdentificationResult.suggestedTags,
          typeTags: ["Bug", "Medicinal"]
        }
      }).success
    ).toBe(false);

    expect(
      identificationResultSchema.safeParse({
        ...validIdentificationResult,
        suggestedTags: {
          ...validIdentificationResult.suggestedTags,
          safetyLabels: ["Look, Don't Touch"]
        }
      }).success
    ).toBe(false);
  });
});
