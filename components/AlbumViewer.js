"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ArrowLeft, Trash2, ZoomIn, ZoomOut, FilePlus, Edit2, Download, FolderDown } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AlbumViewer.module.css";

export default function AlbumViewer({ album }) {
  const router = useRouter();
  const [pages, setPages] = useState(album.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1 is Cover, 0 is first spread
  const [focusedPageIndex, setFocusedPageIndex] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [albumName, setAlbumName] = useState(album.name);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draggedSpreadIndex, setDraggedSpreadIndex] = useState(null);
  const [dragOverSpreadIndex, setDragOverSpreadIndex] = useState(null);
  const titleInputRef = useRef(null);

  const thumbnailRef = useRef(null);
  const scrollTimeout = useRef(null);
  const isProgrammaticScroll = useRef(false);

  // Parse Aspect Ratio
  const [w, h] = album.aspectRatio.split(":").map(Number);
  const aspectRatio = w / h;

  // Group pages into spreads
  const coverPage = pages.find(p => p.pageIndex === -1) || null;
  const spreadPages = pages.filter(p => p.pageIndex >= 0);
  
  const spreads = [];
  for (let i = 0; i < spreadPages.length; i += 2) {
    spreads.push([spreadPages[i] || null, spreadPages[i + 1] || null]);
  }

  useEffect(() => {
    const container = thumbnailRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isProgrammaticScroll.current) {
          const index = Number(entry.target.dataset.index);
          const newPageIndex = index * 2;
          
          setFocusedPageIndex(prev => {
            if (prev !== newPageIndex) {
              return newPageIndex;
            }
            return prev;
          });
        }
      });
    }, {
      root: container,
      rootMargin: "0px -49% 0px -49%",
      threshold: 0
    });

    Array.from(container.children).forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [pages.length]);

  // Sync thumbnail scroll when focusedPageIndex changes
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const isCover = focusedPageIndex === -1;
    const spreadIndex = isCover ? 0 : Math.floor(focusedPageIndex / 2) + 1; // +1 because cover is first child
    const targetChild = thumbnailRef.current.children[spreadIndex];
    if (targetChild) {
      isProgrammaticScroll.current = true;
      const scrollPos = targetChild.offsetLeft - thumbnailRef.current.clientWidth / 2 + targetChild.clientWidth / 2;
      thumbnailRef.current.scrollTo({ left: scrollPos, behavior: "auto" });
      
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    }
  }, [focusedPageIndex]);

  // Debounce main viewer updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPageIndex !== focusedPageIndex) {
        setDirection(focusedPageIndex > currentPageIndex ? 1 : -1);
        setCurrentPageIndex(focusedPageIndex);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [focusedPageIndex, currentPageIndex]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 1));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setFocusedPageIndex((prev) => {
          if (prev + 2 < pages.length) return prev + 2;
          return prev;
        });
      } else if (e.key === "ArrowLeft") {
        setFocusedPageIndex((prev) => {
          if (prev >= 0) return prev === 0 ? -1 : prev - 2;
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages.length]);

  const refreshAlbum = async () => {
    try {
      const res = await fetch(`/api/albums/${album.id}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeAddPages = async () => {
    setConfirmAction(null);
    try {
      await fetch(`/api/albums/${album.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIndex: currentPageIndex })
      });
      await refreshAlbum();
      
      // Focus on the newly added spread
      const targetInsertIndex = currentPageIndex === -1 ? 0 : currentPageIndex + 2;
      setFocusedPageIndex(targetInsertIndex);
    } catch (e) {
      console.error(e);
    }
  };

  const executeDeleteSpread = async () => {
    if (!confirmAction) return;
    const pageIndex = confirmAction.pageIndex;
    setConfirmAction(null);
    try {
      await fetch(`/api/albums/${album.id}/pages?pageIndex=${pageIndex}`, {
        method: "DELETE"
      });
      if (focusedPageIndex >= pages.length - 2 && focusedPageIndex > 0) {
        setFocusedPageIndex(prev => prev - 2);
      }
      await refreshAlbum();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeletePage = (pageIndex) => {
    setConfirmAction({ type: 'deleteSpread', pageIndex });
  };

  const leftPage = currentPageIndex >= 0 ? spreadPages[currentPageIndex] || null : null;
  const rightPage = currentPageIndex >= 0 ? spreadPages[currentPageIndex + 1] || null : null;

  const handleNext = () => {
    setFocusedPageIndex((prev) => {
      if (prev + 2 < spreadPages.length) return prev === -1 ? 0 : prev + 2;
      return prev;
    });
  };

  const handlePrev = () => {
    setFocusedPageIndex((prev) => {
      if (prev >= 0) return prev === 0 ? -1 : prev - 2;
      return prev;
    });
  };

  const handleUpload = async (pageId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pageId", pageId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, photo: data.photo } : p
          )
        );
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const handleDelete = async (pageId, photoId) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, photo: null } : p
          )
        );
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleMove = async (sourcePageId, targetPageId) => {
    if (sourcePageId === targetPageId) return;

    // Optimistically update UI
    setPages((prev) => {
      const sourcePage = prev.find(p => p.id === sourcePageId);
      const targetPage = prev.find(p => p.id === targetPageId);
      if (!sourcePage) return prev;

      return prev.map(p => {
        if (p.id === sourcePageId) return { ...p, photo: targetPage?.photo || null };
        if (p.id === targetPageId) return { ...p, photo: sourcePage.photo };
        return p;
      });
    });

    try {
      await fetch("/api/photos/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePageId, targetPageId }),
      });
    } catch (error) {
      console.error("Move failed", error);
    }
  };

  const handleThumbnailDragStart = (e, index) => {
    setDraggedSpreadIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleThumbnailDragOver = (e, index) => {
    e.preventDefault();
    if (draggedSpreadIndex !== null && draggedSpreadIndex !== index) {
      setDragOverSpreadIndex(index);
    }
  };

  const handleThumbnailDragLeave = (e, index) => {
    e.preventDefault();
    if (dragOverSpreadIndex === index) {
      setDragOverSpreadIndex(null);
    }
  };

  const handleThumbnailDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedSpreadIndex === null || draggedSpreadIndex === targetIndex) {
      setDraggedSpreadIndex(null);
      setDragOverSpreadIndex(null);
      return;
    }

    const newSpreads = [...spreads];
    const [draggedItem] = newSpreads.splice(draggedSpreadIndex, 1);
    newSpreads.splice(targetIndex, 0, draggedItem);

    const newPages = [];
    if (coverPage) newPages.push(coverPage);
    
    let currentIndex = 0;
    const updates = [];
    
    newSpreads.forEach(spread => {
      if (spread[0]) {
        const p = { ...spread[0], pageIndex: currentIndex++ };
        newPages.push(p);
        updates.push({ id: p.id, pageIndex: p.pageIndex });
      }
      if (spread[1]) {
        const p = { ...spread[1], pageIndex: currentIndex++ };
        newPages.push(p);
        updates.push({ id: p.id, pageIndex: p.pageIndex });
      }
    });

    setPages(newPages);
    setDraggedSpreadIndex(null);
    setDragOverSpreadIndex(null);
    setFocusedPageIndex(targetIndex * 2);

    try {
      await fetch(`/api/albums/${album.id}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
    } catch (err) {
      console.error("Failed to reorder", err);
      refreshAlbum();
    }
  };

  const handleDownloadCSV = () => {
    // Exclude cover (pageIndex === -1), sort by pageIndex ascending
    const photoPages = [...pages]
      .filter(p => p.pageIndex >= 0)
      .sort((a, b) => a.pageIndex - b.pageIndex);
    
    // Create CSV content
    const csvRows = ["Photo Name"];
    photoPages.forEach(p => {
      // If there is a photo, use originalName, else empty string
      const name = p.photo ? p.photo.originalName : "";
      // Escape quotes for CSV
      const escapedName = name.includes(',') || name.includes('"') ? `"${name.replace(/"/g, '""')}"` : name;
      csvRows.push(escapedName);
    });

    const csvString = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${albumName}_photos.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFolder = () => {
    window.location.href = `/api/albums/${album.id}/download`;
  };

  const handleTitleSubmit = async (newName = albumName) => {
    if (!newName.trim()) {
      setAlbumName(album.name); // Revert if empty
      setIsEditingTitle(false);
      return;
    }
    
    try {
      await fetch(`/api/albums/${album.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      setIsEditingTitle(false);
    } catch (e) {
      console.error("Update title failed", e);
      setAlbumName(album.name);
      setIsEditingTitle(false);
    }
  };



  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.closeBtn} onClick={() => router.push("/")}>
            <ArrowLeft size={20} />
            <span>Fold & Return to Bookshelf</span>
          </button>
        </div>
        
        <div className={styles.headerCenter}>
          {isEditingTitle ? (
            <span
              ref={titleInputRef}
              className={styles.titleInput}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const text = e.target.innerText;
                setAlbumName(text);
                handleTitleSubmit(text);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const text = e.target.innerText;
                  setAlbumName(text);
                  handleTitleSubmit(text);
                } else if (e.key === 'Escape') {
                  e.target.innerText = album.name;
                  setAlbumName(album.name);
                  setIsEditingTitle(false);
                }
              }}
            >
              {albumName}
            </span>
          ) : (
            <div 
              className={styles.titleDisplay} 
              onClick={() => {
                setIsEditingTitle(true);
                setTimeout(() => {
                  if (titleInputRef.current) {
                    titleInputRef.current.focus();
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(titleInputRef.current);
                    range.collapse(false); // Move cursor to end
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }, 0);
              }}
              title="Click to edit name"
            >
              <h2>{albumName}</h2>
              <Edit2 size={16} className={styles.editIcon} />
            </div>
          )}
        </div>
        
        <div className={styles.headerRight}></div>
      </header>

      <div className={styles.albumArea}>
        <AnimatePresence mode="wait" custom={direction}>
          {currentPageIndex === -1 ? (
            <motion.div
              key="cover"
              custom={direction}
              initial={{ opacity: 0, rotateY: direction === -1 ? -15 : 15, scale: zoomLevel * 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: zoomLevel }}
              exit={{ opacity: 0, rotateY: 15, scale: zoomLevel * 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`${styles.spread} ${styles.coverView}`}
              style={{ aspectRatio: `${aspectRatio * 2} / 1` }} 
            >
              <div style={{ flex: 1, visibility: "hidden" }}></div>
              <div className={`${styles.page} ${styles.rightPage}`} onClick={handleNext}>
                {coverPage && (
                  <PageContent 
                    page={coverPage} 
                    onUpload={(file) => handleUpload(coverPage.id, file)} 
                    onDelete={(photoId) => handleDelete(coverPage.id, photoId)}
                    isCover={true}
                  />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentPageIndex}
              custom={direction}
              initial={{ opacity: 0, rotateY: direction === 1 ? -15 : 15, scale: zoomLevel * 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: zoomLevel }}
              exit={{ opacity: 0, rotateY: direction === 1 ? 15 : -15, scale: zoomLevel * 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={styles.spread}
              style={{ aspectRatio: `${aspectRatio * 2} / 1` }} // Two pages side by side
            >
              {/* LEFT PAGE */}
              <div 
                className={`${styles.page} ${styles.leftPage}`} 
                onClick={handlePrev}
              >
                {leftPage && (
                  <PageContent 
                    page={leftPage} 
                    onUpload={(file) => handleUpload(leftPage.id, file)} 
                    onDelete={(photoId) => handleDelete(leftPage.id, photoId)}
                    onMove={(sourceId) => handleMove(sourceId, leftPage.id)}
                  />
                )}
              </div>

              {/* RIGHT PAGE */}
              <div 
                className={`${styles.page} ${styles.rightPage}`} 
                onClick={handleNext}
              >
                {rightPage && (
                  <PageContent 
                    page={rightPage} 
                    onUpload={(file) => handleUpload(rightPage.id, file)} 
                    onDelete={(photoId) => handleDelete(rightPage.id, photoId)}
                    onMove={(sourceId) => handleMove(sourceId, rightPage.id)}
                  />
                )}
              </div>

              {/* Binder shadow */}
              <div className={styles.binder}></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.controls}>
        <div className={styles.topControls}>
          <button 
            className={styles.addPageBtn}
            onClick={() => setConfirmAction({ type: 'add' })}
            title="Add 2 pages after current spread"
          >
            <FilePlus size={20} />
          </button>
          
          <button 
            className={`${styles.trashZone} ${focusedPageIndex === -1 ? styles.disabledControl : ""}`}
            onClick={() => {
              if (focusedPageIndex !== -1) confirmDeletePage(focusedPageIndex);
            }}
            title={focusedPageIndex === -1 ? "Cover cannot be deleted" : "Delete Current Spread"}
            disabled={focusedPageIndex === -1}
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={handleZoomOut} disabled={zoomLevel <= 0.5} title="Zoom Out">
            <ZoomOut size={20} />
          </button>
          <span className={styles.zoomText}>{Math.round(zoomLevel * 100)}%</span>
          <button className={styles.zoomBtn} onClick={handleZoomIn} disabled={zoomLevel >= 1} title="Zoom In">
            <ZoomIn size={20} />
          </button>
          <div className={styles.divider}></div>
          <button className={styles.zoomBtn} onClick={handleDownloadCSV} title="Download Photo Names (CSV)">
            <Download size={20} />
          </button>
          <button className={styles.zoomBtn} onClick={handleDownloadFolder} title="Download Original Photos (ZIP)">
            <FolderDown size={20} />
          </button>
        </div>
        <span className={styles.pageIndicator}>
          {focusedPageIndex === -1 ? 'Cover' : `Pages ${focusedPageIndex + 1} - ${Math.min(focusedPageIndex + 2, spreadPages.length)} of ${spreadPages.length}`}
        </span>
      </div>

      <div 
        className={styles.thumbnailTrack}
        ref={thumbnailRef}
      >
        {/* COVER THUMBNAIL */}
        {coverPage && (
          <div 
            data-index={-0.5} // special index to compute -1
            className={`${styles.thumbnailSpread} ${focusedPageIndex === -1 ? styles.activeThumbnail : ""}`}
            style={{ aspectRatio: `${aspectRatio} / 1` }}
            onClick={() => setFocusedPageIndex(-1)}
          >
            <div className={`${styles.thumbnailPage} ${styles.rightPage}`}>
              {coverPage.photo && <img src={coverPage.photo.filePath} alt="" loading="lazy" decoding="async" />}
            </div>
          </div>
        )}

        {/* SPREAD THUMBNAILS */}
        {spreads.map((spread, index) => {
          const isActive = Math.floor(focusedPageIndex / 2) === index && focusedPageIndex !== -1;
          return (
            <div 
              key={index} 
              data-index={index}
              className={`${styles.thumbnailSpread} ${isActive ? styles.activeThumbnail : ""} ${draggedSpreadIndex === index ? styles.dragging : ""} ${dragOverSpreadIndex === index ? styles.dragOver : ""}`}
              style={{ aspectRatio: `${aspectRatio * 2} / 1` }}
              draggable
              onDragStart={(e) => handleThumbnailDragStart(e, index)}
              onDragOver={(e) => handleThumbnailDragOver(e, index)}
              onDragLeave={(e) => handleThumbnailDragLeave(e, index)}
              onDrop={(e) => handleThumbnailDrop(e, index)}
              onClick={() => {
                if (focusedPageIndex !== index * 2) {
                  setFocusedPageIndex(index * 2);
                }
              }}
            >
              <div className={`${styles.thumbnailPage} ${styles.leftPage}`}>
                {spread[0]?.photo && <img src={spread[0].photo.filePath} alt="" loading="lazy" decoding="async" />}
              </div>
              <div className={`${styles.thumbnailPage} ${styles.rightPage}`}>
                {spread[1]?.photo && <img src={spread[1].photo.filePath} alt="" loading="lazy" decoding="async" />}
              </div>
            </div>
          );
        })}
      </div>

      {confirmAction && confirmAction.type === 'add' && (
        <ConfirmModal 
          title="장 추가"
          message="현재 보고 있는 위치의 다음 장에 2장의 새로운 페이지를 추가하시겠습니까? (이후 페이지들은 뒤로 밀립니다)"
          onConfirm={executeAddPages}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction && confirmAction.type === 'deleteSpread' && (
        <ConfirmModal 
          title="페이지 삭제"
          message="정말 이 페이지들(좌/우 2장)을 앨범에서 삭제하시겠습니까? (이후 페이지들이 앞으로 당겨집니다)"
          onConfirm={executeDeleteSpread}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function PageContent({ page, onUpload, onDelete, onMove, isCover }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e) => {
    if (isCover) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    if (isCover) return;
    setIsDragging(false);
  };

  const onDrop = (e) => {
    if (isCover) return;
    e.preventDefault();
    setIsDragging(false);
    
    const sourcePageId = e.dataTransfer.getData("sourcePageId");
    if (sourcePageId) {
      if (onMove) onMove(sourcePageId);
    } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragStart = (e) => {
    e.dataTransfer.setData("sourcePageId", page.id);
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  if (page.photo) {
    return (
      <div 
        className={`${styles.photoContainer} ${isDragging ? styles.dragging : ""}`}
        onClick={(e) => {}}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        draggable={!isCover}
        onDragStart={!isCover ? onDragStart : undefined}
      >
        <img 
          src={page.photo.filePath} 
          alt={page.photo.originalName} 
          className={styles.photo} 
        />
        <button 
          className={styles.deleteBtn} 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.photo.id);
          }}
          aria-label="Delete Photo"
        >
          <Trash2 size={20} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.emptyPage} ${isDragging ? styles.dragging : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => {
        e.stopPropagation(); // prevent navigation when clicking '+' area
        fileInputRef.current?.click();
      }}
    >
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={onFileSelect}
      />
      <div className={styles.uploadIcon}>
        <Plus size={48} />
      </div>
      <p className={styles.uploadText}>Click or Drop</p>
    </div>
  );
}
