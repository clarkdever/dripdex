import { z } from "zod";

import { identificationResultSchema } from "../identification/identification-schema";
import {
  aiProviderEventSchema,
  type AiProviderEvent
} from "./ai-provider";

const nonEmptyString = z.string().min(1);

export const aiProviderMetadataSchema = z
  .object({
    id: nonEmptyString,
    model: nonEmptyString
  })
  .strict();

export const aiProviderNeedsOwnerInputResponseSchema = z
  .object({
    type: z.literal("needs_owner_input"),
    provider: aiProviderMetadataSchema,
    question: nonEmptyString
  })
  .strict();

export const aiProviderIdentificationCandidateResponseSchema = z
  .object({
    type: z.literal("identification_candidate"),
    provider: aiProviderMetadataSchema,
    result: identificationResultSchema
  })
  .strict();

export const aiProviderErrorResponseSchema = z
  .object({
    type: z.literal("provider_error"),
    provider: aiProviderMetadataSchema,
    message: nonEmptyString,
    retryable: z.boolean()
  })
  .strict();

export const aiProviderResponseSchema = z.discriminatedUnion("type", [
  aiProviderNeedsOwnerInputResponseSchema,
  aiProviderIdentificationCandidateResponseSchema,
  aiProviderErrorResponseSchema
]);

export type AiProviderMetadata = z.infer<typeof aiProviderMetadataSchema>;
export type AiProviderResponse = z.infer<typeof aiProviderResponseSchema>;

export function toAiProviderEvents(
  response: AiProviderResponse,
  requestId: string,
  occurredAt: Date
): AiProviderEvent[] {
  if (response.type !== "identification_candidate") {
    return [];
  }

  const occurredAtIso = occurredAt.toISOString();
  const result = response.result;

  return [
    aiProviderEventSchema.parse({
      type: "target_regions_ready",
      requestId,
      sequence: 1,
      occurredAt: occurredAtIso,
      subjectRegions: result.subjectRegions
    }),
    aiProviderEventSchema.parse({
      type: "identity_candidates_ready",
      requestId,
      sequence: 2,
      occurredAt: occurredAtIso,
      identityCandidates: result.identityCandidates
    }),
    aiProviderEventSchema.parse({
      type: "identification_data_ready",
      requestId,
      sequence: 3,
      occurredAt: occurredAtIso,
      result
    })
  ];
}
