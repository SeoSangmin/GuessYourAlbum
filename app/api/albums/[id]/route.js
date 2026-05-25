import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    let album = await prisma.album.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageIndex: "asc" },
          include: {
            photo: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Backward compatibility: Ensure cover page exists
    const hasCover = album.pages.some(p => p.pageIndex === -1);
    if (!hasCover) {
      const newCover = await prisma.page.create({
        data: {
          albumId: album.id,
          pageIndex: -1
        },
        include: { photo: true }
      });
      album.pages = [newCover, ...album.pages];
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: { name }
    });
    
    return NextResponse.json(updatedAlbum);
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json({ error: "Failed to update album name" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.album.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
