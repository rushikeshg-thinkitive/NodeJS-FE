// One row in the conversation list: avatar, title, last-message preview,
// time, and an unread pill.
import Avatar from "../../shared/ui/Avatar.jsx";
import { conversationTitle, unreadFor } from "../../shared/lib/conversation.js";
import { formatTime } from "../../shared/lib/format.js";
import styles from "../../styles/ConversationItem.module.css";

export default function ConversationItem({
  conversation,
  currentUser,
  active,
  onClick,
}) {
  const title = conversationTitle(conversation, currentUser);
  const unread = unreadFor(conversation, currentUser._id);

  return (
    <button
      className={`${styles.item} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      <Avatar name={title} group={conversation.isGroup} size={46} />
      <span className={styles.body}>
        <span className={styles.top}>
          <strong className={styles.title}>{title}</strong>
          <small className={styles.time}>
            {formatTime(conversation.lastMessageAt)}
          </small>
        </span>
        <span className={styles.bottom}>
          <small className={`${styles.preview} ${unread ? styles.bold : ""}`}>
            {conversation.lastMessage || "No messages yet"}
          </small>
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </span>
      </span>
    </button>
  );
}
