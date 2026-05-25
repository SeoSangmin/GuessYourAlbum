import { PrismaClient } from "@prisma/client";
import AlbumViewer from "@/components/AlbumViewer";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function AlbumPage({ params }) {
  const { id } = await params;
  
  const album = await prisma.album.findUnique({
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
    notFound();
  }

  // Convert to plain object to pass to Client Component safely
  const serializedAlbum = JSON.parse(JSON.stringify(album));

  return <AlbumViewer album={serializedAlbum} />;
}
