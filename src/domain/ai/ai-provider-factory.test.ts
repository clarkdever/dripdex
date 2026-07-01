import { describe, expect, it } from "vitest";

import { createAiIdentificationProviderFromEnv } from "./ai-provider-factory";

const mockResult = {
  schemaVersion: "dripdex.identification-result.v1",
  provider: {
    id: "mock-provider",
    model: "mock-vision-model"
  },
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
    typeTags: ["Bug"],
    foodChainTags: ["Predator"],
    seasonality: ["Summer"],
    safetyLabels: ["Do Not Touch"]
  },
  safetyNote: null,
  uncertaintyFlags: ["owner_review_needed"],
  citations: [],
  notes: null
};

const request = {
  requestId: "scan-request-001",
  image: {
    privateImageKey: "private/uploads/scan-request-001.jpg",
    mimeType: "image/jpeg" as const
  },
  subjectHint: null,
  context: {
    observedAt: null,
    publicLocationLabel: "Hays County, TX",
    ownerNotes: null
  }
};

async function collectResponse(provider: ReturnType<typeof createAiIdentificationProviderFromEnv>) {
  return provider.identifyFindResponse(request);
}

describe("AI provider factory", () => {
  it("defaults to the mock provider without requiring API keys", async () => {
    const provider = createAiIdentificationProviderFromEnv(
      {},
      {
        mockResult
      }
    );

    await expect(collectResponse(provider)).resolves.toMatchObject({
      type: "identification_candidate",
      provider: {
        id: "mock-provider"
      }
    });
  });

  it("returns safe provider errors when selected real providers are missing keys", async () => {
    const openAiProvider = createAiIdentificationProviderFromEnv({
      DRIPDEX_AI_PROVIDER: "openai"
    });
    const anthropicProvider = createAiIdentificationProviderFromEnv({
      DRIPDEX_AI_PROVIDER: "anthropic"
    });

    await expect(collectResponse(openAiProvider)).resolves.toEqual({
      type: "provider_error",
      provider: {
        id: "openai",
        model: "gpt-5.5"
      },
      message: "OpenAI identification is not configured.",
      retryable: false
    });
    await expect(collectResponse(anthropicProvider)).resolves.toEqual({
      type: "provider_error",
      provider: {
        id: "anthropic",
        model: "claude-sonnet-4-5-20250929"
      },
      message: "Anthropic identification is not configured.",
      retryable: false
    });
  });

  it("returns safe provider errors for unsupported configured providers", async () => {
    const provider = createAiIdentificationProviderFromEnv({
      DRIPDEX_AI_PROVIDER: "opneai"
    });

    await expect(collectResponse(provider)).resolves.toEqual({
      type: "provider_error",
      provider: {
        id: "unsupported",
        model: "opneai"
      },
      message: "Configured AI identification provider is not supported.",
      retryable: false
    });
  });
});
