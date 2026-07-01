import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { createAiIdentificationProviderFromEnv } from "./ai-provider-factory";
import type { PrivateImageSource } from "./private-image-source";

const liveTestsEnabled = process.env.DRIPDEX_LIVE_AI_TESTS === "1";
const providerName = process.env.DRIPDEX_AI_PROVIDER;

const describeLive = liveTestsEnabled ? describe : describe.skip;

describeLive("live AI provider smoke test", () => {
  it("runs the selected provider against a fixture image and returns a safe response", async () => {
    expect(providerName).toMatch(/^(openai|anthropic)$/);

    const imageSource = createFixtureImageSource();
    const provider = createAiIdentificationProviderFromEnv(process.env, {
      imageSource,
      mockResult: null
    });

    const response = await provider.identifyFindResponse({
      requestId: "live-smoke-house-finch",
      image: {
        privateImageKey: "private/live-smoke/house-finch.jpg",
        mimeType: "image/jpeg"
      },
      subjectHint: null,
      context: {
        observedAt: null,
        publicLocationLabel: "Texas Hill Country",
        ownerNotes: "Fixture image smoke test."
      }
    });

    expect(response.type).toMatch(/^(identification_candidate|needs_owner_input)$/);
    expect(JSON.stringify(response)).not.toContain("private/live-smoke");
  });

  function createFixtureImageSource(): PrivateImageSource {
    return {
      async loadPrivateImage(image) {
        const file = await readFile("docs/fixtures/source-images/house-finch.jpg");

        return {
          base64: file.toString("base64"),
          mimeType: image.mimeType
        };
      }
    };
  }
});
