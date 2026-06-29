import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

const allowedFileName = /^[a-z0-9-]+-(card|thumb|full)\.jpg$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await context.params;

  if (!allowedFileName.test(fileName)) {
    return new NextResponse("Fixture image not found", { status: 404 });
  }

  try {
    const image = await readFile(
      join(process.cwd(), "docs/fixtures/web-images", fileName)
    );

    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/jpeg"
      }
    });
  } catch {
    return new NextResponse("Fixture image not found", { status: 404 });
  }
}
