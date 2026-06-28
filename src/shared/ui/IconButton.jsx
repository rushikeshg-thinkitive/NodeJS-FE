// A round, accessible icon button used across the app (back, close, theme…).
import styles from "../../styles/IconButton.module.css";

export default function IconButton({ children, label, className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
