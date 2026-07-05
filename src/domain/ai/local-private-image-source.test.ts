import { describe, expect, it } from "vitest";
import { createLocalPrivateImageSource } from "./local-private-image-source";
import { join } from "path";
import { mkdir, writeFile, rm } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";

describe("createLocalPrivateImageSource", () => {
  it("reads an image from the local filesystem", async () => {
    const tempDir = join(tmpdir(), `dripdex-test-${randomUUID()}`);
    await mkdir(join(tempDir, "private", "uploads"), { recursive: true });

    const testContent = Buffer.from("fake-image-content");
    const testPath = join("private", "uploads", "test.jpg");
    await writeFile(join(tempDir, testPath), testContent);

    const source = createLocalPrivateImageSource(tempDir);
    const result = await source.loadPrivateImage({
      mimeType: "image/jpeg",
      privateImageKey: testPath
    });

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.base64).toBe(testContent.toString("base64"));

    await rm(tempDir, { recursive: true, force: true });
  });

  it("rejects invalid keys", async () => {
    const source = createLocalPrivateImageSource("/tmp");
    await expect(
      source.loadPrivateImage({
        mimeType: "image/jpeg",
        privateImageKey: "../private/uploads/test.jpg"
      })
    ).rejects.toThrow("Invalid private image key");
  });
});
