// ─────────────────────────────────────────────────────────────────────────
// The chat page shell (after login). Owns:
//   • users (for the New-chat picker)
//   • the selected conversation and the open thread
//   • the responsive one-pane/two-pane behaviour (.showChat on phones)
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getUsers } from "../shared/api/client.js";
import { markAsRead } from "../shared/realtime/socket.js";
import { unreadFor } from "../shared/lib/conversation.js";
import { useConversations } from "../features/conversations/useConversations.js";
import ConversationList from "../features/conversations/ConversationList.jsx";
import ChatView from "../features/messages/ChatView.jsx";
import ThreadPanel from "../features/threads/ThreadPanel.jsx";
import styles from "../styles/AppShell.module.css";

export default function AppShell({ user, onLogout, theme, onToggleTheme }) {
  const { conversations, loadMore, hasMore, loadingMore } =
    useConversations(user);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openThread, setOpenThread] = useState(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  // Open a conversation → select, and only mark read if there's anything unread.
  function selectConversation(conv) {
    setSelected(conv);
    setOpenThread(null);
    if (conv && unreadFor(conv, user._id) > 0) {
      markAsRead(conv._id, user._id);
    }
  }

  return (
    <div className={`${styles.shell} ${selected ? styles.showChat : ""}`}>
      <div className={styles.sidebar}>
        <ConversationList
          user={user}
          users={users}
          conversations={conversations}
          selected={selected}
          onSelect={selectConversation}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          loadMore={loadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      </div>

      <div className={styles.main}>
        <ChatView
          user={user}
          conversation={selected}
          onBack={() => setSelected(null)}
          onOpenThread={setOpenThread}
        />
      </div>

      {openThread && (
        <ThreadPanel
          user={user}
          parent={openThread}
          conversation={selected}
          onClose={() => setOpenThread(null)}
        />
      )}
    </div>
  );
}
