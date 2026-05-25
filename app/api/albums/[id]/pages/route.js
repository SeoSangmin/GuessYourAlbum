import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { pageIndex } = await request.json();

    if (typeof pageIndex !== "number") {
      return NextResponse.json({ error: "Invalid pageIndex" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Shift existing pages +2
      await tx.page.updateMany({
        where: { albumId: id, pageIndex: { gte: pageIndex } },
        data: { pageIndex: { increment: 2 } },
      });

      // 2. Create 2 new pages
      await tx.page.create({ data: { albumId: id, pageIndex: pageIndex } });
      await tx.page.create({ data: { albumId: id, pageIndex: pageIndex + 1 } });

      // 3. Update album totalPages
      await tx.album.update({
        where: { id },
        data: { totalPages: { increment: 2 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding pages:", error);
    return NextResponse.json({ error: "Failed to add pages" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const pageIndex = parseInt(url.searchParams.get("pageIndex"), 10);

    if (isNaN(pageIndex)) {
      return NextResponse.json({ error: "Invalid pageIndex" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete the 2 pages
      await tx.page.deleteMany({
        where: { albumId: id, pageIndex: { in: [pageIndex, pageIndex + 1] } },
      });

      // 2. Shift subsequent pages -2
      await tx.page.updateMany({
        where: { albumId: id, pageIndex: { gt: pageIndex + 1 } },
        data: { pageIndex: { decrement: 2 } },
      });

      // 3. Update album totalPages
      await tx.album.update({
        where: { id },
        data: { totalPages: { decrement: 2 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pages:", error);
    return NextResponse.json({ error: "Failed to delete pages" }, { status: 500 });
  }
}
