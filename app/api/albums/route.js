import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        pages: {
          where: { pageIndex: -1 },
          include: { photo: true }
        }
      }
    });
    return NextResponse.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, aspectRatio, totalPages, coverImage } = data;

    const album = await prisma.album.create({
      data: {
        name,
        aspectRatio,
        totalPages: parseInt(totalPages, 10),
        coverImage,
        pages: {
          create: [
            { pageIndex: -1 }, // The Cover Page
            ...Array.from({ length: parseInt(totalPages, 10) }).map((_, index) => ({
              pageIndex: index,
            }))
          ],
        },
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}
