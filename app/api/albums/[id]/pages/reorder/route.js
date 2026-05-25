import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id: albumId } = await params;
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates array" }, { status: 400 });
    }

    // Use a transaction to update all page indices at once
    await prisma.$transaction(
      updates.map((update) => 
        prisma.page.update({
          where: { id: update.id },
          data: { pageIndex: update.pageIndex }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder pages error:", error);
    return NextResponse.json({ error: "Failed to reorder pages" }, { status: 500 });
  }
}
