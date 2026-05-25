import { X } from "lucide-react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={`glass ${styles.modal}`}>
        <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
          <X size={24} />
        </button>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.btnNo} onClick={onCancel}>아니오</button>
          <button className={styles.btnYes} onClick={onConfirm}>예</button>
        </div>
      </div>
    </div>
  );
}
