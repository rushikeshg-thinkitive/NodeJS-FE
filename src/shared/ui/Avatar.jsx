// Round avatar showing a person's/group's initial in a deterministic color.
import { initial, avatarColor } from "../lib/format.js";
import styles from "../../styles/Avatar.module.css";

export default function Avatar({ name, size = 44, group = false }) {
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: group ? "var(--accent)" : avatarColor(name),
        fontSize: size * 0.42,
      }}
    >
      {group ? "#" : initial(name)}
    </span>
  );
}
