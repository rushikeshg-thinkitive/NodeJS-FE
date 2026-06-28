// ─────────────────────────────────────────────────────────────────────────
// Thread panel — a side-conversation off one parent message.
// Right-side drawer on desktop, full-screen overlay on phones.
// The parent message is pinned on top; replies below reuse the bubble layout;
// the composer reuses <MessageComposer>.
// ─────────────────────────────────────────────────────────────────────────
import { fileUrl } from "../../shared/config.js";
import { senderIdOf } from "../../shared/lib/conversation.js";
import IconButton from "../../shared/ui/IconButton.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import MessageComposer from "../messages/MessageComposer.jsx";
import { useThread } from "./useThread.js";
import styles from "../../styles/ThreadPanel.module.css";

// Compact reply renderer (threads stay WhatsApp-style: name only on others').
function Reply({ message, mine }) {
  return (
    <div className={`${styles.row} ${mine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        {!mine && message.senderId?.name && (
          <div className={styles.sender}>{message.senderId.name}</div>
        )}
        {message.type === "image" ? (
          <img className={styles.image} src={fileUrl(message.fileUrl)} alt="" />
        ) : message.type === "file" ? (
          <a
            className={styles.file}
            href={fileUrl(message.fileUrl)}
            target="_blank"
            rel="noreferrer"
          >
            📎 {message.fileName}
          </a>
        ) : (
          <div className={styles.text}>{message.text}</div>
        )}
      </div>
    </div>
  );
}

export default function ThreadPanel({ user, parent, conversation, onClose }) {
  const { replies, send } = useThread(parent, conversation, user);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.panel}>
        <header className={styles.header}>
          <strong>Thread</strong>
          <IconButton label="Close thread" onClick={onClose}>
            ✕
          </IconButton>
        </header>

        {/* The message this thread is about */}
        <div className={styles.parent}>
          <div className={styles.sender}>{parent.senderId?.name || "Message"}</div>
          {parent.type === "image" ? (
            <img className={styles.image} src={fileUrl(parent.fileUrl)} alt="" />
          ) : parent.type === "file" ? (
            <a href={fileUrl(parent.fileUrl)} target="_blank" rel="noreferrer">
              📎 {parent.fileName}
            </a>
          ) : (
            <div className={styles.text}>{parent.text}</div>
          )}
        </div>

        <div className={styles.replies}>
          {replies.length === 0 ? (
            <EmptyState
              icon="🧵"
              title="No replies yet"
              subtitle="Start the thread below."
            />
          ) : (
            replies.map((m) => (
              <Reply
                key={m._id}
                message={m}
                mine={senderIdOf(m) === user._id}
              />
            ))
          )}
        </div>

        <MessageComposer onSend={send} />
      </aside>
    </>
  );
}
