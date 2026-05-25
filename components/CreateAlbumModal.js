"use client";

import { useState } from "react";
import { X } from "lucide-react";
import styles from "./CreateAlbumModal.module.css";
import { useRouter } from "next/navigation";

export default function CreateAlbumModal({ onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(3);
  const [totalPages, setTotalPages] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          aspectRatio: `${width}:${height}`,
          totalPages,
          coverImage: null, // Basic white by default, could be updated later
        }),
      });

      if (res.ok) {
        const album = await res.json();
        router.push(`/album/${album.id}`);
      } else {
        console.error("Failed to create album");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`glass ${styles.modal}`}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <h2 className={styles.title}>Create New Album</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Album Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Trip"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Aspect Ratio (Width : Height)</label>
            <div className={styles.ratioInputs}>
              <input 
                type="number" 
                required 
                min="1" 
                value={width} 
                onChange={(e) => setWidth(e.target.value)}
              />
              <span>:</span>
              <input 
                type="number" 
                required 
                min="1" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Total Pages</label>
            <input 
              type="number" 
              required 
              min="2" 
              step="2" 
              value={totalPages} 
              onChange={(e) => setTotalPages(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="button-primary" 
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Album"}
          </button>
        </form>
      </div>
    </div>
  );
}
