// Friendly placeholder for empty areas (no chat selected, no replies, …).
import styles from "../../styles/EmptyState.module.css";

export default function EmptyState({ icon = "💬", title, subtitle }) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      {title && <p className={styles.title}>{title}</p>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
