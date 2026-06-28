// ─────────────────────────────────────────────────────────────────────────
// One message bubble. Right if mine, left if theirs. Renders text / image /
// file, an optional quoted reply, ✓/✓✓ read ticks, and an action bar
// (Reply, Thread) that sits in the gutter BESIDE the bubble — never over it.
// ─────────────────────────────────────────────────────────────────────────
import { fileUrl } from "../../shared/config.js";
import {
  isReadByOthers,
  senderIdOf,
} from "../../shared/lib/conversation.js";
import { formatTime } from "../../shared/lib/format.js";
import styles from "../../styles/MessageBubble.module.css";

// Shared body renderer (text / image / file).
function Body({ message }) {
  if (message.type === "image") {
    return (
      <a href={fileUrl(message.fileUrl)} target="_blank" rel="noreferrer">
        <img
          className={styles.image}
          src={fileUrl(message.fileUrl)}
          alt={message.fileName || "image"}
        />
      </a>
    );
  }
  if (message.type === "file") {
    return (
      <a
        className={styles.file}
        href={fileUrl(message.fileUrl)}
        target="_blank"
        rel="noreferrer"
      >
        📎 {message.fileName || "Download file"}
      </a>
    );
  }
  return <div className={styles.text}>{message.text}</div>;
}

export default function MessageBubble({
  message,
  currentUser,
  participantIds,
  lastReadAt,
  showName,
  onReply,
  onOpenThread,
}) {
  const mine = senderIdOf(message) === currentUser._id;
  const senderName =
    typeof message.senderId === "object" ? message.senderId?.name : "";
  const read =
    mine && isReadByOthers(message, lastReadAt, participantIds, currentUser._id);

  return (
    <div className={`${styles.row} ${mine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        {!mine && showName && senderName && (
          <div className={styles.sender}>{senderName}</div>
        )}

        {message.replyTo && (
          <div className={styles.quote}>
            <strong>{message.replyTo.senderId?.name || "Message"}</strong>
            <span>{message.replyTo.text || `[${message.replyTo.type}]`}</span>
          </div>
        )}

        <Body message={message} />

        {/* "This message has a thread" indicator — click to open it */}
        {message.hasThread && (
          <button
            className={styles.threadChip}
            onClick={() => onOpenThread(message)}
          >
            🧵 View thread <span className={styles.threadArrow}>→</span>
          </button>
        )}

        <div className={styles.meta}>
          <span>{formatTime(message.createdAt)}</span>
          {mine && (
            <span className={`${styles.ticks} ${read ? styles.read : ""}`}>
              {read ? "✓✓" : "✓"}
            </span>
          )}
        </div>

        {/* Floating hover toolbar (pill), anchored to the bubble's top corner */}
        <div className={styles.toolbar}>
          <button title="Reply" onClick={() => onReply(message)}>
            ↩
          </button>
          <button title="Open thread" onClick={() => onOpenThread(message)}>
            🧵
          </button>
        </div>
      </div>
    </div>
  );
}
