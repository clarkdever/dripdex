import { z } from "zod";

import {
  identificationCandidateSchema,
  identificationResultSchema,
  identificationSubjectRegionSchema,
  type IdentificationResult
} from "../identification/identification-schema";
import type { AiProviderResponse } from "./ai-provider-response";
import { validatePrivateImageKey } from "./private-image-source";

const nonEmptyString = z.string().min(1);

export const aiProviderSubjectHintSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1)
  })
  .strict();

export const aiIdentificationRequestSchema = z
  .object({
    requestId: nonEmptyString,
    image: z
      .object({
        privateImageKey: nonEmptyString.refine(
          (key) => validatePrivateImageKey(key).success,
          "invalid private image key"
        ),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"])
      })
      .strict(),
    subjectHint: aiProviderSubjectHintSchema.nullable(),
    context: z
      .object({
        observedAt: z.string().datetime().nullable(),
        publicLocationLabel: nonEmptyString.nullable(),
        ownerNotes: nonEmptyString.nullable()
      })
      .strict()
  })
  .strict();

const aiProviderBaseEventSchema = z.object({
  requestId: nonEmptyString,
  sequence: z.number().int().positive(),
  occurredAt: z.string().datetime()
});

export const aiProviderTargetRegionsReadyEventSchema = aiProviderBaseEventSchema
  .extend({
    type: z.literal("target_regions_ready"),
    subjectRegions: z.array(identificationSubjectRegionSchema)
  })
  .strict();

export const aiProviderIdentityCandidatesReadyEventSchema = aiProviderBaseEventSchema
  .extend({
    type: z.literal("identity_candidates_ready"),
    identityCandidates: z.array(identificationCandidateSchema).min(1)
  })
  .strict();

export const aiProviderIdentificationDataReadyEventSchema = aiProviderBaseEventSchema
  .extend({
    type: z.literal("identification_data_ready"),
    result: identificationResultSchema
  })
  .strict();

export const aiProviderEventSchema = z.discriminatedUnion("type", [
  aiProviderTargetRegionsReadyEventSchema,
  aiProviderIdentityCandidatesReadyEventSchema,
  aiProviderIdentificationDataReadyEventSchema
]);

export type AiProviderSubjectHint = z.infer<typeof aiProviderSubjectHintSchema>;
export type AiIdentificationRequest = z.infer<typeof aiIdentificationRequestSchema>;
export type AiProviderTargetRegionsReadyEvent = z.infer<
  typeof aiProviderTargetRegionsReadyEventSchema
>;
export type AiProviderIdentityCandidatesReadyEvent = z.infer<
  typeof aiProviderIdentityCandidatesReadyEventSchema
>;
export type AiProviderIdentificationDataReadyEvent = z.infer<
  typeof aiProviderIdentificationDataReadyEventSchema
>;
export type AiProviderEvent = z.infer<typeof aiProviderEventSchema>;

export type AiProviderEventValidationResult =
  | {
      success: true;
      event: AiProviderEvent;
    }
  | {
      success: false;
      event: null;
    };

export type AiIdentificationProvider = {
  identifyFind(request: AiIdentificationRequest): AsyncIterable<AiProviderEvent>;
};

export type AiIdentificationResponseProvider = AiIdentificationProvider & {
  identifyFindResponse(request: AiIdentificationRequest): Promise<AiProviderResponse>;
};

export type CreateMockAiIdentificationProviderOptions = {
  result: unknown;
  now?: () => Date;
};

export function validateAiProviderEvent(event: unknown): AiProviderEventValidationResult {
  const result = aiProviderEventSchema.safeParse(event);

  if (!result.success) {
    return {
      success: false,
      event: null
    };
  }

  return {
    success: true,
    event: result.data
  };
}

export function createMockAiIdentificationProvider(
  options: CreateMockAiIdentificationProviderOptions
): AiIdentificationResponseProvider {
  const result = identificationResultSchema.parse(options.result);
  const now = options.now ?? (() => new Date());

  return {
    async identifyFindResponse(request) {
      aiIdentificationRequestSchema.parse(request);

      return {
        type: "identification_candidate",
        provider: result.provider,
        result: result as IdentificationResult
      };
    },
    async *identifyFind(request) {
      const parsedRequest = aiIdentificationRequestSchema.parse(request);
      const occurredAt = toIsoString(now());

      yield parseAiProviderEvent({
        type: "target_regions_ready",
        requestId: parsedRequest.requestId,
        sequence: 1,
        occurredAt,
        subjectRegions: result.subjectRegions
      });
      yield parseAiProviderEvent({
        type: "identity_candidates_ready",
        requestId: parsedRequest.requestId,
        sequence: 2,
        occurredAt,
        identityCandidates: result.identityCandidates
      });
      yield parseAiProviderEvent({
        type: "identification_data_ready",
        requestId: parsedRequest.requestId,
        sequence: 3,
        occurredAt,
        result
      });
    }
  };
}

function parseAiProviderEvent(event: unknown): AiProviderEvent {
  return aiProviderEventSchema.parse(event);
}

function toIsoString(date: Date): string {
  const time = date.getTime();

  if (!Number.isFinite(time)) {
    throw new Error("Mock AI provider clock must return a valid Date.");
  }

  return date.toISOString();
}
