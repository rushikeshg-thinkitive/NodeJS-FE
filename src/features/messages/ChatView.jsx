// ─────────────────────────────────────────────────────────────────────────
// Right pane — the open conversation. Header (with mobile back button),
// message list, and composer. Owns the local "reply" state and forwards
// "open thread" up to the shell.
// ─────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import Avatar from "../../shared/ui/Avatar.jsx";
import IconButton from "../../shared/ui/IconButton.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import { useMessages } from "./useMessages.js";
import MessageList from "./MessageList.jsx";
import MessageComposer from "./MessageComposer.jsx";
import {
  conversationTitle,
  participantIdsOf,
} from "../../shared/lib/conversation.js";
import styles from "../../styles/ChatView.module.css";

export default function ChatView({
  user,
  conversation,
  onBack,
  onOpenThread,
}) {
  const { messages, send, loadOlder, hasMore, loadingOlder, lastReadAt } =
    useMessages(conversation, user);
  const [replyingTo, setReplyingTo] = useState(null);

  const participantIds = useMemo(
    () => participantIdsOf(conversation),
    [conversation],
  );

  if (!conversation) {
    return (
      <section className={styles.chat}>
        <EmptyState
          icon="💬"
          title="Your messages"
          subtitle="Select a conversation or start a new chat to begin."
        />
      </section>
    );
  }

  const title = conversationTitle(conversation, user);

  function handleSend(payload) {
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
        onReply={setReplyingTo}
        onOpenThread={onOpenThread}
        loadOlder={loadOlder}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
      />

      <MessageComposer
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </section>
  );
}
