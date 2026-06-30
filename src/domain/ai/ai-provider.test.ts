import { describe, expect, it } from "vitest";

import {
  aiProviderEventSchema,
  createMockAiIdentificationProvider,
  type AiProviderEvent,
  type AiIdentificationProvider,
  validateAiProviderEvent
} from "./ai-provider";

const mockIdentificationResult = {
  schemaVersion: "dripdex.identification-result.v1",
  provider: {
    id: "mock-provider",
    model: "mock-vision-model"
  },
  subjectRegions: [
    {
      regionId: "region-green-insect-001",
      label: "green insect",
      confidence: 0.86,
      sourceModel: "mock-vision-model",
      box: {
        x: 0.24,
        y: 0.18,
        width: 0.38,
        height: 0.44
      }
    }
  ],
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
    typeTags: ["Bug", "Flying", "Light"],
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
  notes: "Mock result for provider contract tests."
};

const request = {
  requestId: "scan-request-001",
  image: {
    privateImageKey: "private/uploads/scan-request-001.jpg",
    mimeType: "image/jpeg" as const
  },
  subjectHint: {
    x: 0.42,
    y: 0.58
  },
  context: {
    observedAt: "2026-06-30T12:00:00.000Z",
    publicLocationLabel: "Hays County, TX",
    ownerNotes: "Found near the porch light."
  }
};

async function collectEvents(provider: AiIdentificationProvider): Promise<AiProviderEvent[]> {
  const events: AiProviderEvent[] = [];

  for await (const event of provider.identifyFind(request)) {
    events.push(event);
  }

  return events;
}

describe("AI identification provider", () => {
  it("emits ordered validated mock events for target regions, candidates, and final data", async () => {
    const provider = createMockAiIdentificationProvider({
      result: mockIdentificationResult,
      now: () => new Date("2026-06-30T12:05:00.000Z")
    });

    const events = await collectEvents(provider);

    expect(events.map((event) => event.type)).toEqual([
      "target_regions_ready",
      "identity_candidates_ready",
      "identification_data_ready"
    ]);
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3]);
    expect(events.every((event) => aiProviderEventSchema.safeParse(event).success)).toBe(true);
    expect(events).toMatchObject([
      {
        requestId: "scan-request-001",
        occurredAt: "2026-06-30T12:05:00.000Z",
        subjectRegions: mockIdentificationResult.subjectRegions
      },
      {
        requestId: "scan-request-001",
        identityCandidates: mockIdentificationResult.identityCandidates
      },
      {
        requestId: "scan-request-001",
        result: mockIdentificationResult
      }
    ]);
  });

  it("exposes validated events instead of raw model text deltas", () => {
    expect(
      aiProviderEventSchema.safeParse({
        type: "raw_model_delta",
        requestId: "scan-request-001",
        sequence: 1,
        occurredAt: "2026-06-30T12:05:00.000Z",
        text: "maybe a lacewing"
      }).success
    ).toBe(false);

    expect(
      validateAiProviderEvent({
        type: "identity_candidates_ready",
        requestId: "scan-request-001",
        sequence: 2,
        occurredAt: "2026-06-30T12:05:00.000Z",
        identityCandidates: "probably a lacewing"
      })
    ).toEqual({
      success: false,
      event: null
    });
  });

  it("keeps the provider interface swappable for a future Gemini wrapper", async () => {
    const geminiLikeProvider: AiIdentificationProvider = {
      async *identifyFind(input) {
        const validation = validateAiProviderEvent({
          type: "identification_data_ready",
          requestId: input.requestId,
          sequence: 1,
          occurredAt: "2026-06-30T12:06:00.000Z",
          result: mockIdentificationResult
        });

        if (!validation.success) {
          throw new Error("Expected test Gemini-like event to validate");
        }

        yield validation.event;
      }
    };

    const events = await collectEvents(geminiLikeProvider);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "identification_data_ready",
      requestId: "scan-request-001",
      result: mockIdentificationResult
    });
  });
});
