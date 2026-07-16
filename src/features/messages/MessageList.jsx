// ─────────────────────────────────────────────────────────────────────────
// Scrollable message area with day separators.
//
// Scroll behaviour (WhatsApp-style):
//   • open a chat           → jump to the newest message (bottom)
//   • scroll near the top    → load older messages, keeping the view anchored
//   • a new message arrives  → follow it only if you were already near the bottom
// ─────────────────────────────────────────────────────────────────────────
import { useLayoutEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { formatDay } from "../../shared/lib/format.js";
import styles from "../../styles/MessageList.module.css";

export default function MessageList({
  messages,
  currentUser,
  participantIds,
  lastReadAt,
  isGroup,
  onReply,
  onEdit,
  onOpenThread,
  loadOlder,
  hasMore,
  loadingOlder,
}) {
  const listRef = useRef(null);
  const prevRef = useRef({ firstId: null, lastId: null, len: 0 });
  const anchorRef = useRef(null); // scrollHeight captured just before loading older
  const nearBottomRef = useRef(true);

  // After every messages change, decide how to position the scroll.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    if (messages.length === 0) {
      prevRef.current = { firstId: null, lastId: null, len: 0 };
      return;
    }

    const prev = prevRef.current;
    const firstId = messages[0]._id;
    const lastId = messages[messages.length - 1]._id;

    const isInitial = prev.len === 0;
    const prepended = !isInitial && firstId !== prev.firstId && lastId === prev.lastId;
    const appended = !isInitial && lastId !== prev.lastId;

    if (isInitial) {
      el.scrollTop = el.scrollHeight; // open at the newest message
    } else if (prepended && anchorRef.current != null) {
      // Older messages were added above — shift down by exactly their height so
      // the message you were looking at stays put (no jump).
      el.scrollTop += el.scrollHeight - anchorRef.current;
      anchorRef.current = null;
    } else if (appended && nearBottomRef.current) {
      el.scrollTop = el.scrollHeight; // follow the new message
    }

    prevRef.current = { firstId, lastId, len: messages.length };
  }, [messages]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 140;

    // Near the top → pull the previous page.
    if (el.scrollTop < 80 && hasMore && !loadingOlder) {
      anchorRef.current = el.scrollHeight; // remember height before the prepend
      loadOlder();
    }
  }

  let lastDay = null;
  return (
    <div className={styles.list} ref={listRef} onScroll={handleScroll}>
      {loadingOlder && <div className={styles.loadingTop}>Loading older…</div>}

      {messages.map((m) => {
        const day = formatDay(m.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;
        return (
          <div key={m._id} className={styles.group}>
            {showDay && (
              <div className={styles.daySep}>
                <span>{day}</span>
              </div>
            )}
            <MessageBubble
              message={m}
              currentUser={currentUser}
              participantIds={participantIds}
              lastReadAt={lastReadAt}
              showName={isGroup}
              onReply={onReply}
              onEdit={onEdit}
              onOpenThread={onOpenThread}
            />
          </div>
        );
      })}
    </div>
  );
}
