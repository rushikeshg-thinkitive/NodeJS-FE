// Centered modal dialog. Click the backdrop or ✕ to close.
import IconButton from "./IconButton.jsx";
import styles from "../../styles/Modal.module.css";

export default function Modal({ title, onClose, children }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
