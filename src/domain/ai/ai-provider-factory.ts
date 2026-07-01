import {
  createMockAiIdentificationProvider,
  type AiIdentificationResponseProvider
} from "./ai-provider";
import type { AiProviderMetadata, AiProviderResponse } from "./ai-provider-response";
import { createAnthropicIdentificationProvider } from "./anthropic/anthropic-identification-provider";
import { createOpenAiIdentificationProvider } from "./openai/openai-identification-provider";
import type { PrivateImageSource } from "./private-image-source";

type AiProviderEnv = Record<string, string | undefined>;

type CreateAiProviderOptions = {
  imageSource?: PrivateImageSource;
  mockResult?: unknown;
};

const defaultMockResult = {
  schemaVersion: "dripdex.identification-result.v1",
  provider: {
    id: "mock-provider",
    model: "mock-vision-model"
  },
  subjectRegions: [],
  identityCandidates: [
    {
      candidateId: "candidate-mock-001",
      commonName: "Mock Creature",
      scientificName: null,
      confidence: 0.5,
      reasoningForOwner: "Mock provider result for local development.",
      lookalikes: []
    }
  ],
  suggestedCategory: "mystery",
  suggestedTags: {
    typeTags: ["Mystery"],
    foodChainTags: [],
    seasonality: [],
    safetyLabels: []
  },
  safetyNote: null,
  uncertaintyFlags: ["owner_review_needed"],
  citations: [],
  notes: "Mock result."
};

export function createAiIdentificationProviderFromEnv(
  env: AiProviderEnv = process.env,
  options: CreateAiProviderOptions = {}
): AiIdentificationResponseProvider {
  const provider = env.DRIPDEX_AI_PROVIDER ?? "mock";

  if (provider === "openai") {
    const model = env.OPENAI_IDENTIFICATION_MODEL ?? "gpt-5.5";

    if (!env.OPENAI_API_KEY) {
      return createUnavailableProvider(
        {
          id: "openai",
          model
        },
        "OpenAI identification is not configured."
      );
    }

    return createOpenAiIdentificationProvider({
      apiKey: env.OPENAI_API_KEY,
      imageSource: options.imageSource,
      model
    });
  }

  if (provider === "anthropic") {
    const model = env.ANTHROPIC_IDENTIFICATION_MODEL ?? "claude-sonnet-4-5-20250929";

    if (!env.ANTHROPIC_API_KEY) {
      return createUnavailableProvider(
        {
          id: "anthropic",
          model
        },
        "Anthropic identification is not configured."
      );
    }

    return createAnthropicIdentificationProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      imageSource: options.imageSource,
      model
    });
  }

  if (provider !== "mock") {
    return createUnavailableProvider(
      {
        id: "unsupported",
        model: provider
      },
      "Configured AI identification provider is not supported."
    );
  }

  return createMockAiIdentificationProvider({
    result: options.mockResult ?? defaultMockResult
  });
}

function createUnavailableProvider(
  provider: AiProviderMetadata,
  message: string
): AiIdentificationResponseProvider {
  return {
    async *identifyFind() {
      return;
    },
    async identifyFindResponse(): Promise<AiProviderResponse> {
      return {
        type: "provider_error",
        provider,
        message,
        retryable: false
      };
    }
  };
}
