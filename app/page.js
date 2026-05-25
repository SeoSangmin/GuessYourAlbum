"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import CreateAlbumModal from "@/components/CreateAlbumModal";
import ConfirmModal from "@/components/ConfirmModal";
import styles from "./page.module.css";

export default function Bookshelf() {
  const [albums, setAlbums] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/albums")
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch albums", err);
        setLoading(false);
      });
  }, [isModalOpen]); // refetch when modal closes (album might be added)

  const [albumToDelete, setAlbumToDelete] = useState(null);

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    try {
      const res = await fetch(`/api/albums/${albumToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== albumToDelete));
      }
    } catch (e) {
      console.error("Failed to delete album", e);
    }
    setAlbumToDelete(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>My Album Bookshelf</h1>
        <p>Pick an album to view or create a new one.</p>
      </header>

      <div className={styles.shelfContainer}>
        <div className={styles.shelf}>
          {loading ? (
            <p>Loading your albums...</p>
          ) : albums.length === 0 ? (
            <p className={styles.emptyText}>The shelf is empty.</p>
          ) : (
            albums.map((album) => {
              const dynamicCoverUrl = album.pages?.[0]?.photo?.filePath?.replace('./public', '');
              const coverUrl = dynamicCoverUrl || album.coverImage;
              
              // Calculate width based on a fixed height of 200px
              const [w, h] = album.aspectRatio.split(':').map(Number);
              const bookHeight = 200;
              const bookWidth = (w / h) * bookHeight;

              return (
                <Link 
                  href={`/album/${album.id}`} 
                  key={album.id} 
                  className={styles.book}
                  style={{ width: `${bookWidth}px`, height: `${bookHeight}px` }}
                >
                  <div 
                    className={styles.bookCover}
                    style={coverUrl ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: "#fff" }}
                  >
                    <span 
                      className={styles.bookTitle}
                      style={{ color: coverUrl ? '#fff' : '#333', textShadow: coverUrl ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none' }}
                    >
                      {album.name}
                    </span>
                  </div>
                  <div className={styles.bookSpine}></div>
                  <button 
                    className={styles.deleteBookBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAlbumToDelete(album.id);
                    }}
                    title="Delete Album"
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={`button-icon ${styles.createBtn}`} 
          onClick={() => setIsModalOpen(true)}
          aria-label="Create Album"
        >
          <Plus size={32} />
        </button>
      </div>

      {isModalOpen && <CreateAlbumModal onClose={() => setIsModalOpen(false)} />}
      
      {albumToDelete && (
        <ConfirmModal 
          title="Delete Album"
          message="Are you sure you want to permanently delete this album and all its photos?"
          onConfirm={confirmDeleteAlbum}
          onCancel={() => setAlbumToDelete(null)}
        />
      )}
    </div>
  );
}
