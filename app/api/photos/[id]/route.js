import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete from DB
    await prisma.photo.delete({
      where: { id },
    });

    // Attempt to delete from filesystem
    try {
      const filePath = path.join(process.cwd(), "public", photo.filePath);
      await fs.unlink(filePath);
    } catch (fsError) {
      console.error("Failed to delete file from filesystem:", fsError);
      // It's okay if the file is already gone, we still want to return success for DB deletion
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
