import { describe, expect, it } from "vitest";

import {
  aiProviderResponseSchema,
  toAiProviderEvents
} from "./ai-provider-response";

const provider = {
  id: "openai",
  model: "gpt-5.5"
};

const identificationResult = {
  schemaVersion: "dripdex.identification-result.v1",
  provider,
  subjectRegions: [],
  identityCandidates: [
    {
      candidateId: "candidate-green-lacewing-001",
      commonName: "Green Lacewing",
      scientificName: "Chrysoperla rufilabris",
      confidence: 0.78,
      reasoningForOwner: "The green body and delicate wings fit a lacewing.",
      lookalikes: ["Small green moth"]
    }
  ],
  suggestedCategory: "insect",
  suggestedTags: {
    typeTags: ["Bug", "Flying"],
    foodChainTags: ["Predator"],
    seasonality: ["Summer"],
    safetyLabels: ["Do Not Touch"]
  },
  safetyNote: "Avoid handling until the owner confirms the ID.",
  uncertaintyFlags: ["owner_review_needed"],
  citations: [
    {
      label: "BugGuide",
      url: "https://bugguide.net/"
    }
  ],
  notes: "Candidate requires owner confirmation."
};

describe("AI provider response contract", () => {
  it("accepts owner question responses without mutating identification result state", () => {
    const response = aiProviderResponseSchema.parse({
      type: "needs_owner_input",
      provider,
      question: "Can you share whether the insect was found near a porch light?"
    });

    expect(response.type).toBe("needs_owner_input");
    expect(toAiProviderEvents(response, "scan-request-001", new Date())).toEqual([]);
  });

  it("converts validated candidate responses into existing provider events", () => {
    const response = aiProviderResponseSchema.parse({
      type: "identification_candidate",
      provider,
      result: identificationResult
    });

    const events = toAiProviderEvents(
      response,
      "scan-request-001",
      new Date("2026-07-01T12:00:00.000Z")
    );

    expect(events.map((event) => event.type)).toEqual([
      "target_regions_ready",
      "identity_candidates_ready",
      "identification_data_ready"
    ]);
    expect(events[2]).toMatchObject({
      result: identificationResult
    });
  });

  it("accepts safe provider errors and rejects raw provider payloads", () => {
    expect(
      aiProviderResponseSchema.safeParse({
        type: "provider_error",
        provider,
        message: "The provider response could not be validated.",
        retryable: false
      }).success
    ).toBe(true);

    expect(
      aiProviderResponseSchema.safeParse({
        type: "raw_provider_payload",
        provider,
        raw: {
          apiKey: "secret",
          text: "maybe a lacewing"
        }
      }).success
    ).toBe(false);
  });
});
