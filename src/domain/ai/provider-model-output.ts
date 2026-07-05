import { z } from "zod";

import {
  identificationResultSchema,
  type IdentificationResult
} from "../identification/identification-schema";
import type { AiProviderMetadata, AiProviderResponse } from "./ai-provider-response";

const providerlessIdentificationResultSchema = identificationResultSchema.omit({
  provider: true
});

const modelOutputSchema = z.discriminatedUnion("responseMode", [
  z
    .object({
      responseMode: z.literal("needs_owner_input"),
      question: z
        .string()
        .min(1)
        .refine(isPrivacySafeOwnerQuestion, "unsafe owner question"),
      result: z.null().optional()
    })
    .strict(),
  z
    .object({
      responseMode: z.literal("identification_candidate"),
      question: z.null().optional(),
      result: providerlessIdentificationResultSchema
    })
    .strict()
]);

export function parseProviderModelOutput(
  rawOutput: unknown,
  provider: AiProviderMetadata,
  errorMessage: string
): AiProviderResponse {
  const parsedJson = parseJsonObject(rawOutput);

  if (parsedJson === null) {
    return providerError(provider, errorMessage);
  }

  // Support direct IdentificationResult schema (from OpenAI Structured Outputs)
  if (
    typeof parsedJson === "object" &&
    parsedJson !== null &&
    "schemaVersion" in parsedJson &&
    parsedJson.schemaVersion === "dripdex.identification-result.v1"
  ) {
    const result = identificationResultSchema.safeParse({
      ...parsedJson,
      provider
    });

    if (!result.success) {
      return providerError(provider, errorMessage);
    }

    return {
      type: "identification_candidate",
      provider,
      result: result.data as IdentificationResult
    };
  }

  const parsedOutput = modelOutputSchema.safeParse(parsedJson);

  if (!parsedOutput.success) {
    return providerError(provider, errorMessage);
  }

  if (parsedOutput.data.responseMode === "needs_owner_input") {
    return {
      type: "needs_owner_input",
      provider,
      question: parsedOutput.data.question
    };
  }

  const result = identificationResultSchema.safeParse({
    ...parsedOutput.data.result,
    provider
  });

  if (!result.success) {
    return providerError(provider, errorMessage);
  }

  return {
    type: "identification_candidate",
    provider,
    result: result.data as IdentificationResult
  };
}

function parseJsonObject(rawOutput: unknown): unknown | null {
  if (typeof rawOutput === "string") {
    try {
      return JSON.parse(rawOutput) as unknown;
    } catch {
      return null;
    }
  }

  return rawOutput;
}

function providerError(provider: AiProviderMetadata, message: string): AiProviderResponse {
  return {
    type: "provider_error",
    provider,
    message,
    retryable: true
  };
}

function isPrivacySafeOwnerQuestion(question: string): boolean {
  const normalized = question.toLowerCase();
  const disallowedPatterns = [
    /\bexact\s+(gps|location|address|coordinates?)\b/,
    /\b(gps|latitude|longitude|coordinates?)\b/,
    /\bhome\s+address\b/,
    /\bstreet\s+address\b/,
    /\bexif\b/,
    /\bprivate\s+image\s+key\b/,
    /\bprivate\/[a-z0-9/_\-.]+/i
  ];

  return !disallowedPatterns.some((pattern) => pattern.test(normalized));
}
