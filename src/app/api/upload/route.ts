import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files?.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buf);
      urls.push(`/uploads/${filename}`);
    }
    return NextResponse.json({ success: true, urls });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
