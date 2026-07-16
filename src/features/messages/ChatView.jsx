// ─────────────────────────────────────────────────────────────────────────
// Right pane — the open conversation. Header (with mobile back button),
// message list, and composer. Owns the local "reply" state and forwards
// "open thread" up to the shell.
// ─────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import Avatar from "../../shared/ui/Avatar.jsx";
import IconButton from "../../shared/ui/IconButton.jsx";
import { useMessages } from "./useMessages.js";
import MessageList from "./MessageList.jsx";
import MessageComposer from "./MessageComposer.jsx";
import {
  conversationTitle,
  participantIdsOf,
} from "../../shared/lib/conversation.js";
import styles from "../../styles/ChatView.module.css";

export default function ChatView({ user, conversation, onBack, onOpenThread }) {
  const {
    messages,
    send,
    edit,
    loadOlder,
    hasMore,
    loadingOlder,
    lastReadAt,
    typingUser,
    notifyTyping,
  } = useMessages(conversation, user);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editing, setEditing] = useState(null); // my message being edited

  // Reply and edit are exclusive — starting one cancels the other.
  function startReply(message) {
    setReplyingTo(message);
    setEditing(null);
  }
  function startEdit(message) {
    setEditing(message);
    setReplyingTo(null);
  }

  const participantIds = useMemo(
    () => participantIdsOf(conversation),
    [conversation],
  );

  if (!conversation) {
    return (
      <section className={styles.chat}>
        <div className={styles.placeholder}>
          <div className={styles.illustration} />
          <h2 className={styles.placeholderTitle}>Chat Web</h2>
          <p className={styles.placeholderText}>
            Send and receive messages in real time. Select a conversation or
            start a new chat to begin.
          </p>
        </div>
      </section>
    );
  }

  const title = conversationTitle(conversation, user);

  function handleSend(payload) {
    if (editing) {
      edit(editing._id, payload.text); // an edit only changes the text
      setEditing(null);
      return;
    }
    send(payload, replyingTo);
    setReplyingTo(null);
  }

  return (
    <section className={styles.chat}>
      <header className={styles.header}>
        <IconButton label="Back" className={styles.back} onClick={onBack}>
          ←
        </IconButton>
        <Avatar name={title} group={conversation.isGroup} size={38} />
        <div className={styles.title}>
          <strong>{title}</strong>
          {conversation.isGroup && (
            <small className="muted">{participantIds.length} members</small>
          )}
        </div>
      </header>

      <MessageList
        messages={messages}
        currentUser={user}
        participantIds={participantIds}
        lastReadAt={lastReadAt}
        isGroup={conversation.isGroup}
        onReply={startReply}
        onEdit={startEdit}
        onOpenThread={onOpenThread}
        loadOlder={loadOlder}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
      />

      {/* "Name is typing…" — sits just above the composer, WhatsApp-style */}
      {typingUser && (
        <div className={styles.typingBar}>
          <span className={styles.typingBubble}>
            {typingUser} is typing
            <span className={styles.dots}>
              <i />
              <i />
              <i />
            </span>
          </span>
        </div>
      )}

      <MessageComposer
        onSend={handleSend}
        onTyping={notifyTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
      />
    </section>
  );
}
