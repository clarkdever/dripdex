import { describe, expect, it } from "vitest";

import { validatePrivateImageKey } from "./private-image-source";

describe("private image source boundary", () => {
  it("accepts private image keys and rejects paths or URLs", () => {
    expect(validatePrivateImageKey("private/uploads/scan-request-001.jpg")).toEqual({
      success: true
    });

    expect(validatePrivateImageKey("../private/uploads/scan-request-001.jpg")).toEqual({
      success: false,
      reason: "invalid_private_image_key"
    });
    expect(validatePrivateImageKey("/private/uploads/scan-request-001.jpg")).toEqual({
      success: false,
      reason: "invalid_private_image_key"
    });
    expect(validatePrivateImageKey("https://example.com/photo.jpg")).toEqual({
      success: false,
      reason: "invalid_private_image_key"
    });
  });
});
