import { NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";

import { createAiIdentificationProviderFromEnv } from "@/domain/ai/ai-provider-factory";
import { createLocalPrivateImageSource } from "@/domain/ai/local-private-image-source";
import { createJsonCaptureDraftRepository } from "@/domain/capture/json-capture-draft-repository";
import { createCaptureDraft, applyCaptureDraftEvent } from "@/domain/capture/draft-state";

const DATA_DIR = join(process.cwd(), ".data");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const subjectHintStr = formData.get("subjectHint") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    // Parse subject hint
    let subjectHint = null;
    if (subjectHintStr) {
      try {
        subjectHint = JSON.parse(subjectHintStr);
      } catch (e) {
        return NextResponse.json({ error: "Invalid subjectHint JSON" }, { status: 400 });
      }
    }

    // Save image locally
    const id = randomUUID();
    const uploadsDir = join(DATA_DIR, "private", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    
    // In real app, you might preserve original extension
    const extension = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${id}.${extension}`;
    const filePath = join(uploadsDir, fileName);
    
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const privateImageKey = `private/uploads/${fileName}`;

    // Create Draft
    const repo = createJsonCaptureDraftRepository(DATA_DIR);
    let draft = createCaptureDraft({
      id,
      startedAt: new Date(),
      startMethod: "photo_upload",
      originalImageKey: privateImageKey
    });

    if (subjectHint) {
      draft = applyCaptureDraftEvent(draft, {
        type: "subject_tap_recorded",
        point: subjectHint,
        occurredAt: new Date()
      });
    }

    await repo.save(draft);

    // Call AI
    const imageSource = createLocalPrivateImageSource(DATA_DIR);
    const provider = createAiIdentificationProviderFromEnv(process.env, {
      imageSource
    });

    const aiResponse = await provider.identifyFindResponse({
      requestId: id,
      image: {
        mimeType: imageFile.type as "image/jpeg" | "image/png" | "image/webp",
        privateImageKey
      },
      subjectHint: draft.subjectTap ?? undefined,
      context: {
        approximateLocation: null,
        localTimeRaw: new Date().toISOString(),
        ownerNotes: null
      }
    });

    if (aiResponse.type === "identification_candidate") {
      // Pick the top candidate
      const topCandidate = aiResponse.result.identityCandidates[0];
      if (topCandidate) {
        draft = applyCaptureDraftEvent(draft, {
          type: "ai_candidate_recorded",
          candidate: {
            commonName: topCandidate.commonName,
            scientificName: topCandidate.scientificName,
            confidence: topCandidate.confidence >= 0.8 ? "high" : topCandidate.confidence >= 0.5 ? "medium" : "low"
          },
          occurredAt: new Date()
        });
      }
    } else {
      draft = applyCaptureDraftEvent(draft, {
        type: "ai_failed",
        error: {
          code: aiResponse.type === "provider_error" ? "provider_unavailable" : "unknown",
          message: aiResponse.type === "provider_error" ? aiResponse.message : "AI returned non-candidate response"
        },
        occurredAt: new Date()
      });
    }

    await repo.save(draft);

    return NextResponse.json({
      draftId: id,
      result: aiResponse
    });

  } catch (error: any) {
    console.error("Error in /api/identify:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
