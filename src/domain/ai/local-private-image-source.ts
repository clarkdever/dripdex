import { readFile } from "fs/promises";
import { join } from "path";

import type { PrivateImageData, PrivateImageSource } from "./private-image-source";
import { validatePrivateImageKey } from "./private-image-source";
import type { AiIdentificationRequest } from "./ai-provider";

export function createLocalPrivateImageSource(dataDir: string): PrivateImageSource {
  return {
    async loadPrivateImage(
      image: AiIdentificationRequest["image"]
    ): Promise<PrivateImageData> {
      const validation = validatePrivateImageKey(image.privateImageKey);
      if (!validation.success) {
        throw new Error("Invalid private image key");
      }

      // We expect the privateImageKey to be a relative path under the dataDir.
      // E.g., "private/uploads/xxx.jpg"
      const fullPath = join(dataDir, image.privateImageKey);
      const buffer = await readFile(fullPath);

      return {
        base64: buffer.toString("base64"),
        mimeType: image.mimeType
      };
    }
  };
}
