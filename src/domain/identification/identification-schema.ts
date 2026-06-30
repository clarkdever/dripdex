import { z } from "zod";

import {
  categorySchema,
  foodChainTagSchema,
  safetyLabelSchema,
  seasonalitySchema,
  typeTagSchema
} from "../taxonomy/taxonomy-schemas";

const nonEmptyString = z.string().min(1);
const confidenceScoreSchema = z.number().min(0).max(1);

export const identificationUncertaintyFlagSchema = z.enum([
  "blurry_photo",
  "lookalike_species",
  "low_detail",
  "multiple_subjects",
  "partially_obscured",
  "season_context_needed",
  "location_context_needed",
  "owner_review_needed"
]);

export const identificationNormalizedBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1)
  })
  .strict()
  .superRefine((box, context) => {
    if (box.x + box.width > 1) {
      context.addIssue({
        code: "custom",
        message: "normalized box x + width must not exceed 1",
        path: ["width"]
      });
    }

    if (box.y + box.height > 1) {
      context.addIssue({
        code: "custom",
        message: "normalized box y + height must not exceed 1",
        path: ["height"]
      });
    }
  });

export const identificationSubjectRegionSchema = z
  .object({
    regionId: nonEmptyString,
    label: nonEmptyString,
    confidence: confidenceScoreSchema,
    sourceModel: nonEmptyString,
    box: identificationNormalizedBoxSchema
  })
  .strict();

export const identificationCandidateSchema = z
  .object({
    candidateId: nonEmptyString,
    commonName: nonEmptyString,
    scientificName: nonEmptyString.nullable(),
    confidence: confidenceScoreSchema,
    reasoningForOwner: nonEmptyString,
    lookalikes: z.array(nonEmptyString)
  })
  .strict();

export const identificationTagSuggestionsSchema = z
  .object({
    typeTags: z.array(typeTagSchema),
    foodChainTags: z.array(foodChainTagSchema),
    seasonality: z.array(seasonalitySchema),
    safetyLabels: z.array(safetyLabelSchema)
  })
  .strict();

export const identificationCitationSchema = z
  .object({
    label: nonEmptyString,
    url: z.string().url()
  })
  .strict();

export const identificationResultSchema = z
  .object({
    schemaVersion: z.literal("dripdex.identification-result.v1"),
    provider: z
      .object({
        id: nonEmptyString,
        model: nonEmptyString
      })
      .strict(),
    subjectRegions: z.array(identificationSubjectRegionSchema),
    identityCandidates: z.array(identificationCandidateSchema).min(1),
    suggestedCategory: categorySchema,
    suggestedTags: identificationTagSuggestionsSchema,
    safetyNote: nonEmptyString.nullable(),
    uncertaintyFlags: z.array(identificationUncertaintyFlagSchema),
    citations: z.array(identificationCitationSchema),
    notes: nonEmptyString.nullable()
  })
  .strict();

export type IdentificationUncertaintyFlag = z.infer<
  typeof identificationUncertaintyFlagSchema
>;
export type IdentificationNormalizedBox = z.infer<
  typeof identificationNormalizedBoxSchema
>;
export type IdentificationSubjectRegion = z.infer<
  typeof identificationSubjectRegionSchema
>;
export type IdentificationCandidate = z.infer<typeof identificationCandidateSchema>;
export type IdentificationTagSuggestions = z.infer<
  typeof identificationTagSuggestionsSchema
>;
export type IdentificationCitation = z.infer<typeof identificationCitationSchema>;
export type IdentificationResult = z.infer<typeof identificationResultSchema>;
