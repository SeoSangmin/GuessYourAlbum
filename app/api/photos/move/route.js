import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { sourcePageId, targetPageId } = await request.json();

    if (!sourcePageId || !targetPageId || sourcePageId === targetPageId) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const sourcePhoto = await prisma.photo.findUnique({ where: { pageId: sourcePageId } });
    const targetPhoto = await prisma.photo.findUnique({ where: { pageId: targetPageId } });

    if (!sourcePhoto) {
      return NextResponse.json({ error: "Source photo not found" }, { status: 404 });
    }

    if (targetPhoto) {
      // SWAP: Both pages have photos. 
      // Because pageId is @unique, we use a temporary placeholder to avoid constraint errors.
      const tempId = `temp_${Date.now()}`;
      await prisma.$transaction([
        prisma.photo.update({ where: { id: sourcePhoto.id }, data: { pageId: tempId } }),
        prisma.photo.update({ where: { id: targetPhoto.id }, data: { pageId: sourcePageId } }),
        prisma.photo.update({ where: { id: sourcePhoto.id }, data: { pageId: targetPageId } }),
      ]);
    } else {
      // MOVE: Target page is empty.
      await prisma.photo.update({
        where: { id: sourcePhoto.id },
        data: { pageId: targetPageId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moving/swapping photo:", error);
    return NextResponse.json({ error: "Failed to move/swap photo" }, { status: 500 });
  }
}
