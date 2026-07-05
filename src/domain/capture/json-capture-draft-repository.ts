import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type {
  CaptureDraft,
  CaptureDraftRepository,
  CaptureDraftSearchStatus
} from "./draft-state";
import { getCaptureDraftSearchStatus } from "./draft-state";

export function createJsonCaptureDraftRepository(dataDir: string): CaptureDraftRepository {
  const draftsDir = join(dataDir, "private", "drafts");

  async function ensureDir() {
    await mkdir(draftsDir, { recursive: true });
  }

  return {
    async save(draft: CaptureDraft): Promise<void> {
      await ensureDir();
      const filePath = join(draftsDir, `${draft.id}.json`);
      await writeFile(filePath, JSON.stringify(draft, null, 2), "utf-8");
    },

    async getById(id: string): Promise<CaptureDraft | null> {
      try {
        const filePath = join(draftsDir, `${id}.json`);
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content) as CaptureDraft;
      } catch (error: any) {
        if (error.code === "ENOENT") {
          return null;
        }
        throw error;
      }
    },

    async listBySearchStatus(status: CaptureDraftSearchStatus): Promise<CaptureDraft[]> {
      // For MVP, we don't strictly need list functionality immediately,
      // but if we do, we'd need to read all JSON files in the directory.
      // This is a naive implementation.
      try {
        const { readdir } = await import("fs/promises");
        const files = await readdir(draftsDir);
        const drafts: CaptureDraft[] = [];

        for (const file of files) {
          if (file.endsWith(".json")) {
            const content = await readFile(join(draftsDir, file), "utf-8");
            const draft = JSON.parse(content) as CaptureDraft;
            if (getCaptureDraftSearchStatus(draft) === status) {
              drafts.push(draft);
            }
          }
        }
        return drafts;
      } catch (error: any) {
        if (error.code === "ENOENT") {
          return [];
        }
        throw error;
      }
    }
  };
}
