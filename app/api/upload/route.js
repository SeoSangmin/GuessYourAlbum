import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pageId = formData.get("pageId");

    if (!file || !pageId) {
      return NextResponse.json({ error: "Missing file or pageId" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Keep original filename, but prepend uuid to avoid collisions
    const originalName = file.name;
    const safeName = `${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buffer);

    const publicPath = `/uploads/${safeName}`;

    // Upsert photo for the page (replace if exists)
    const photo = await prisma.photo.upsert({
      where: { pageId },
      update: {
        originalName,
        filePath: publicPath,
      },
      create: {
        pageId,
        originalName,
        filePath: publicPath,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
