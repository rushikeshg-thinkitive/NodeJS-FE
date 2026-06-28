// ─────────────────────────────────────────────────────────────────────────
// Left pane — current-user header (with theme toggle + logout), a New-chat
// button, and the live conversation list. On phones this is the only visible
// pane until a chat is opened.
// ─────────────────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import Avatar from "../../shared/ui/Avatar.jsx";
import IconButton from "../../shared/ui/IconButton.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import ConversationItem from "./ConversationItem.jsx";
import NewChatModal from "./NewChatModal.jsx";
import styles from "../../styles/ConversationList.module.css";

export default function ConversationList({
  user,
  users,
  conversations,
  selected,
  onSelect,
  onLogout,
  theme,
  onToggleTheme,
  loadMore,
  hasMore,
  loadingMore,
}) {
  const [showNewChat, setShowNewChat] = useState(false);
  const listRef = useRef(null);

  // Near the bottom → load the next (older) page of conversations.
  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 120 &&
      hasMore &&
      !loadingMore
    ) {
      loadMore();
    }
  }

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <Avatar name={user.name} size={40} />
        <div className={styles.me}>
          <strong>{user.name}</strong>
          <small className="muted">You</small>
        </div>
        <IconButton
          label="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </IconButton>
        <IconButton label="Log out" onClick={onLogout}>
          ⎋
        </IconButton>
      </header>

      <div className={styles.newChatWrap}>
        <button className={styles.newChat} onClick={() => setShowNewChat(true)}>
          <span>＋</span> New chat
        </button>
      </div>

      <div className={styles.list} ref={listRef} onScroll={handleScroll}>
        {conversations.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No conversations"
            subtitle="Start a new chat to begin messaging."
          />
        ) : (
          <>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUser={user}
                active={selected?._id === conv._id}
                onClick={() => onSelect(conv)}
              />
            ))}
            {loadingMore && <div className={styles.loadingMore}>Loading…</div>}
          </>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          currentUser={user}
          users={users}
          onClose={() => setShowNewChat(false)}
          onCreated={(conv) => {
            onSelect(conv);
            setShowNewChat(false);
          }}
        />
      )}
    </aside>
  );
}
