// ─────────────────────────────────────────────────────────────────────────
// One message bubble. Right if mine, left if theirs. Renders text / image /
// file, an optional quoted reply, ✓/✓✓ read ticks, and an action bar
// (Reply, Thread) that sits in the gutter BESIDE the bubble — never over it.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { fileUrl } from "../../shared/config.js";
import { isReadByOthers, senderIdOf } from "../../shared/lib/conversation.js";
import { formatTime } from "../../shared/lib/format.js";
import styles from "../../styles/MessageBubble.module.css";

// WhatsApp-style ticks: single gray = sent, double blue = read.
// stroke="currentColor" lets the .ticks / .read CSS classes set the color.
function Ticks({ read }) {
  return read ? (
    <svg viewBox="0 0 24 20" className={styles.tickSvg} aria-label="Read">
      <path
        d="M1 10.5L5 14.5L13 5.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10.5L11 14.5L19 5.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className={styles.tickSvg} aria-label="Sent">
      <path
        d="M4 10.5L8 14.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    mine &&
    isReadByOthers(message, lastReadAt, participantIds, currentUser._id);

  // Desktop reveals the toolbar on hover; touch devices reveal it on tap.
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`${styles.row} ${mine ? styles.mine : styles.theirs} ${open ? styles.open : ""}`}
    >
      <div className={styles.bubble} onClick={() => setOpen((o) => !o)}>
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
              <Ticks read={read} />
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
