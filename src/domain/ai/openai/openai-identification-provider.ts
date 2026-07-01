import OpenAI from "openai";

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
import { buildOpenAiIdentificationPrompt } from "../prompts/identification-prompts";

export type OpenAiIdentificationProviderOptions = {
  apiKey: string;
  client?: OpenAiResponsesClient;
  imageSource?: PrivateImageSource;
  model: string;
};

export type OpenAiResponsesClient = {
  responses: {
    create(input: unknown): Promise<{
      output_text?: string;
    }>;
  };
};

export function createOpenAiIdentificationProvider(
  options: OpenAiIdentificationProviderOptions
): AiIdentificationResponseProvider {
  const client =
    options.client ??
    new OpenAI({
      apiKey: options.apiKey
    });
  const imageSource = options.imageSource;
  const provider = {
    id: "openai",
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
          message: "OpenAI private image source is not configured.",
          retryable: false
        };
      }

      try {
        const image = await imageSource.loadPrivateImage(parsedRequest.image);
        const prompt = buildOpenAiIdentificationPrompt(parsedRequest);
        const response = await client.responses.create({
          model: options.model,
          instructions: prompt.instructions,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt.inputText
                },
                {
                  type: "input_image",
                  detail: "high",
                  image_url: `data:${image.mimeType};base64,${image.base64}`
                }
              ]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "dripdex_identification_response",
              strict: true,
              schema: dripdexProviderResponseJsonSchema
            }
          }
        });

        return parseProviderModelOutput(
          response.output_text,
          provider,
          "OpenAI response could not be validated."
        );
      } catch {
        return {
          type: "provider_error",
          provider,
          message: "OpenAI response could not be validated.",
          retryable: true
        };
      }
    }
  };
}
