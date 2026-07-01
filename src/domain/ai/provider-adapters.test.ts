import { describe, expect, it } from "vitest";

import { createAnthropicIdentificationProvider } from "./anthropic/anthropic-identification-provider";
import { createOpenAiIdentificationProvider } from "./openai/openai-identification-provider";

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
    ownerNotes: "Found near a porch light."
  }
};

const imageSource = {
  async loadPrivateImage() {
    return {
      base64: "ZmFrZS1pbWFnZQ",
      mimeType: "image/jpeg" as const
    };
  }
};

const candidateResult = {
  schemaVersion: "dripdex.identification-result.v1",
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
  safetyNote: null,
  uncertaintyFlags: ["owner_review_needed"],
  citations: [],
  notes: null
};

describe("real AI provider adapters", () => {
  it("maps OpenAI structured candidate output into a validated provider response", async () => {
    const calls: unknown[] = [];
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create(input) {
            calls.push(input);

            return {
              output_text: JSON.stringify({
                responseMode: "identification_candidate",
                question: null,
                result: candidateResult
              })
            };
          }
        }
      },
      imageSource,
      model: "gpt-5.5"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toMatchObject({
      type: "identification_candidate",
      provider: {
        id: "openai",
        model: "gpt-5.5"
      },
      result: {
        provider: {
          id: "openai",
          model: "gpt-5.5"
        }
      }
    });
    expect(JSON.stringify(calls[0])).not.toContain("private/uploads");
    expect(JSON.stringify(calls[0])).toContain("data:image/jpeg;base64,ZmFrZS1pbWFnZQ");
  });

  it("maps OpenAI question output without creating candidate events", async () => {
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create() {
            return {
              output_text: JSON.stringify({
                responseMode: "needs_owner_input",
                question: "Was it found in water or on dry ground?",
                result: null
              })
            };
          }
        }
      },
      imageSource,
      model: "gpt-5.5"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toEqual({
      type: "needs_owner_input",
      provider: {
        id: "openai",
        model: "gpt-5.5"
      },
      question: "Was it found in water or on dry ground?"
    });
  });

  it("returns safe OpenAI provider errors for privacy-unsafe owner questions", async () => {
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create() {
            return {
              output_text: JSON.stringify({
                responseMode: "needs_owner_input",
                question: "What are the exact GPS coordinates for your home?",
                result: null
              })
            };
          }
        }
      },
      imageSource,
      model: "gpt-5.5"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toEqual({
      type: "provider_error",
      provider: {
        id: "openai",
        model: "gpt-5.5"
      },
      message: "OpenAI response could not be validated.",
      retryable: true
    });
  });

  it("accepts provider-owned metadata when model candidate output omits provider", async () => {
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create() {
            return {
              output_text: JSON.stringify({
                responseMode: "identification_candidate",
                question: null,
                result: candidateResult
              })
            };
          }
        }
      },
      imageSource,
      model: "gpt-5.5"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toMatchObject({
      type: "identification_candidate",
      result: {
        provider: {
          id: "openai",
          model: "gpt-5.5"
        }
      }
    });
  });

  it("returns safe OpenAI provider errors for malformed output", async () => {
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create() {
            return {
              output_text: "{bad json"
            };
          }
        }
      },
      imageSource,
      model: "gpt-5.5"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toEqual({
      type: "provider_error",
      provider: {
        id: "openai",
        model: "gpt-5.5"
      },
      message: "OpenAI response could not be validated.",
      retryable: true
    });
  });

  it("rejects invalid private image keys before OpenAI image loading", async () => {
    let loadCalls = 0;
    const provider = createOpenAiIdentificationProvider({
      apiKey: "test-key",
      client: {
        responses: {
          async create() {
            throw new Error("OpenAI should not be called");
          }
        }
      },
      imageSource: {
        async loadPrivateImage() {
          loadCalls += 1;

          return {
            base64: "ZmFrZS1pbWFnZQ",
            mimeType: "image/jpeg" as const
          };
        }
      },
      model: "gpt-5.5"
    });

    await expect(
      provider.identifyFindResponse({
        ...request,
        image: {
          ...request.image,
          privateImageKey: "../private/uploads/scan-request-001.jpg"
        }
      })
    ).rejects.toThrow("invalid private image key");
    expect(loadCalls).toBe(0);
  });

  it("maps Anthropic tool candidate output into a validated provider response", async () => {
    const calls: unknown[] = [];
    const provider = createAnthropicIdentificationProvider({
      apiKey: "test-key",
      client: {
        messages: {
          async create(input) {
            calls.push(input);

            return {
              content: [
                {
                  type: "tool_use",
                  name: "dripdex_identification_response",
                  input: {
                    responseMode: "identification_candidate",
                    question: null,
                    result: candidateResult
                  }
                }
              ]
            };
          }
        }
      },
      imageSource,
      model: "claude-sonnet-4-5-20250929"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toMatchObject({
      type: "identification_candidate",
      provider: {
        id: "anthropic",
        model: "claude-sonnet-4-5-20250929"
      }
    });
    expect(JSON.stringify(calls[0])).not.toContain("private/uploads");
    expect(JSON.stringify(calls[0])).toContain("ZmFrZS1pbWFnZQ");
  });

  it("maps Anthropic question output into owner input response", async () => {
    const provider = createAnthropicIdentificationProvider({
      apiKey: "test-key",
      client: {
        messages: {
          async create() {
            return {
              content: [
                {
                  type: "tool_use",
                  name: "dripdex_identification_response",
                  input: {
                    responseMode: "needs_owner_input",
                    question: "Can you share whether it was moving or still?",
                    result: null
                  }
                }
              ]
            };
          }
        }
      },
      imageSource,
      model: "claude-sonnet-4-5-20250929"
    });

    await expect(provider.identifyFindResponse(request)).resolves.toEqual({
      type: "needs_owner_input",
      provider: {
        id: "anthropic",
        model: "claude-sonnet-4-5-20250929"
      },
      question: "Can you share whether it was moving or still?"
    });
  });

  it("rejects invalid private image keys before Anthropic image loading", async () => {
    let loadCalls = 0;
    const provider = createAnthropicIdentificationProvider({
      apiKey: "test-key",
      client: {
        messages: {
          async create() {
            throw new Error("Anthropic should not be called");
          }
        }
      },
      imageSource: {
        async loadPrivateImage() {
          loadCalls += 1;

          return {
            base64: "ZmFrZS1pbWFnZQ",
            mimeType: "image/jpeg" as const
          };
        }
      },
      model: "claude-sonnet-4-5-20250929"
    });

    await expect(
      provider.identifyFindResponse({
        ...request,
        image: {
          ...request.image,
          privateImageKey: "https://example.com/photo.jpg"
        }
      })
    ).rejects.toThrow("invalid private image key");
    expect(loadCalls).toBe(0);
  });
});
