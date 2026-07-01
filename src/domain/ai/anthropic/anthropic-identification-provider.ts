import Anthropic from "@anthropic-ai/sdk";

import {
  aiIdentificationRequestSchema,
  type AiIdentificationRequest,
  type AiIdentificationResponseProvider,
  type AiProviderEvent
} from "../ai-provider";
import type { AiProviderResponse } from "../ai-provider-response";
import { toAiProviderEvents } from "../ai-provider-response";
import type { PrivateImageSource } from "../private-image-source";
import { dripdexProviderResponseJsonSchema } from "../identification-output-schema";
import { parseProviderModelOutput } from "../provider-model-output";
import { buildAnthropicIdentificationPrompt } from "../prompts/identification-prompts";

export type AnthropicIdentificationProviderOptions = {
  apiKey: string;
  client?: AnthropicMessagesClient;
  imageSource?: PrivateImageSource;
  model: string;
};

export type AnthropicMessagesClient = {
  messages: {
    create(input: unknown): Promise<{
      content: unknown[];
    }>;
  };
};

export function createAnthropicIdentificationProvider(
  options: AnthropicIdentificationProviderOptions
): AiIdentificationResponseProvider {
  const client =
    options.client ??
    new Anthropic({
      apiKey: options.apiKey
    });
  const imageSource = options.imageSource;
  const provider = {
    id: "anthropic",
    model: options.model
  };

  return {
    async *identifyFind(request): AsyncIterable<AiProviderEvent> {
      const response = await this.identifyFindResponse(request);

      yield* toAiProviderEvents(response, request.requestId, new Date());
    },
    async identifyFindResponse(request: AiIdentificationRequest): Promise<AiProviderResponse> {
      const parsedRequest = aiIdentificationRequestSchema.parse(request);

      if (!imageSource) {
        return {
          type: "provider_error",
          provider,
          message: "Anthropic private image source is not configured.",
          retryable: false
        };
      }

      try {
        const image = await imageSource.loadPrivateImage(parsedRequest.image);
        const prompt = buildAnthropicIdentificationPrompt(parsedRequest);
        const response = await client.messages.create({
          model: options.model,
          max_tokens: 1600,
          system: prompt.system,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: image.mimeType,
                    data: image.base64
                  }
                },
                {
                  type: "text",
                  text: prompt.userText
                }
              ]
            }
          ],
          tools: [
            {
              name: "dripdex_identification_response",
              description:
                "Return either a safe owner question or a structured DripDex identification candidate.",
              input_schema: dripdexProviderResponseJsonSchema
            }
          ],
          tool_choice: {
            type: "tool",
            name: "dripdex_identification_response"
          }
        });

        return parseProviderModelOutput(
          findAnthropicToolInput(response.content),
          provider,
          "Anthropic response could not be validated."
        );
      } catch {
        return {
          type: "provider_error",
          provider,
          message: "Anthropic response could not be validated.",
          retryable: true
        };
      }
    }
  };
}

function findAnthropicToolInput(content: unknown[]): unknown | null {
  const toolUse = content.find(
    (block): block is { input: unknown; name: string; type: "tool_use" } =>
      typeof block === "object" &&
      block !== null &&
      "type" in block &&
      block.type === "tool_use" &&
      "name" in block &&
      block.name === "dripdex_identification_response" &&
      "input" in block
  );

  return toolUse?.input ?? null;
}
