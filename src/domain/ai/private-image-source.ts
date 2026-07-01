import type { AiIdentificationRequest } from "./ai-provider";

export type PrivateImageData = {
  base64: string;
  mimeType: AiIdentificationRequest["image"]["mimeType"];
};

export type PrivateImageSource = {
  loadPrivateImage(image: AiIdentificationRequest["image"]): Promise<PrivateImageData>;
};

export type PrivateImageKeyValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: "invalid_private_image_key";
    };

export function validatePrivateImageKey(key: string): PrivateImageKeyValidationResult {
  if (
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("://") ||
    !key.startsWith("private/")
  ) {
    return {
      success: false,
      reason: "invalid_private_image_key"
    };
  }

  return {
    success: true
  };
}
