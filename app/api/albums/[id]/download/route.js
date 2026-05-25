import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const { ZipArchive } = require("archiver");

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        pages: {
          include: { photo: true }
        }
      }
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Filter pages that have a photo
    const photos = album.pages
      .filter(p => p.photo)
      .map(p => p.photo);

    if (photos.length === 0) {
      return new Response("No photos to download", { status: 400 });
    }

    // "사진 압축이나 이런 거 하지 말고 그대로" -> level: 0
    const archive = new ZipArchive({
      zlib: { level: 0 } 
    });

    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err) => controller.error(err));
      }
    });

    const folderName = `${album.name}_photos`;

    // Map to keep track of name collisions since we aren't ordering them uniquely by index
    const nameCount = {};

    // Add files to archive
    photos.forEach((photo) => {
      const diskPath = path.join(process.cwd(), 'public', photo.filePath);
      if (fs.existsSync(diskPath)) {
        let finalName = photo.originalName;
        if (nameCount[finalName]) {
          const ext = path.extname(finalName);
          const base = path.basename(finalName, ext);
          finalName = `${base} (${nameCount[finalName]})${ext}`;
          nameCount[photo.originalName]++;
        } else {
          nameCount[finalName] = 1;
        }
        
        archive.file(diskPath, { name: `${folderName}/${finalName}` });
      }
    });

    archive.finalize();

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(folderName)}.zip"`,
      }
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to create zip" }, { status: 500 });
  }
}
