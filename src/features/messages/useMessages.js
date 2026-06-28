// ─────────────────────────────────────────────────────────────────────────
// Owns the messages of the open conversation.
//   • join the room + load the NEWEST page (REST) when the conversation changes
//   • loadOlder() fetches the previous page and prepends it (scroll up)
//   • append on "newMessage"
//   • on "messagesRead", advance that user's read cursor (ticks flip)
//   • on "threadUpdated", flag the parent so the thread indicator shows
// Returns the messages, a send(), and pagination helpers.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages } from "../../shared/api/client.js";
import {
  socket,
  joinConversation,
  leaveConversation,
  sendMessage,
  markAsRead,
} from "../../shared/realtime/socket.js";

const PAGE = 50;

export function useMessages(conversation, user) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Per-user read cursors { userId: lastReadTimestamp } → drives ✓✓ ticks.
  const [lastReadAt, setLastReadAt] = useState({});
  const convId = conversation?._id;

  // Refs so loadOlder can read fresh values without re-creating itself.
  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Join room + load the newest page whenever the conversation changes.
  useEffect(() => {
    if (!convId) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    loadingRef.current = false;
    setLoadingOlder(false);
    setMessages([]); // clear the previous conversation for a clean initial load
    setHasMore(false);
    setLastReadAt(conversation.lastReadAt || {}); // seed read cursors
    joinConversation(convId);
    getMessages(convId, { limit: PAGE })
      .then((page) => {
        if (cancelled) return;
        setMessages(page);
        setHasMore(page.length === PAGE);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
      leaveConversation(convId);
    };
  }, [convId]);

  // Fetch the previous (older) page and prepend it.
  const loadOlder = useCallback(async () => {
    if (!convId || loadingRef.current || !hasMoreRef.current) return;
    const oldest = messagesRef.current[0];
    if (!oldest) return;

    loadingRef.current = true;
    setLoadingOlder(true);
    try {
      const older = await getMessages(convId, {
        before: oldest.createdAt,
        limit: PAGE,
      });
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === PAGE);
    } catch (e) {
      console.error(e);
    } finally {
      loadingRef.current = false;
      setLoadingOlder(false);
    }
  }, [convId]);

  // Live incoming messages for THIS conversation.
  useEffect(() => {
    function handleNew(message) {
      if (message.conversationId !== convId) return;
      setMessages((prev) => [...prev, message]);
      // I'm looking at this chat → mark it read so the sender sees ✓✓ and my
      // unread badge stays at 0 (the chat is open).
      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;
      if (senderId !== user._id) markAsRead(convId, user._id);
    }
    socket.on("newMessage", handleNew);
    return () => socket.off("newMessage", handleNew);
  }, [convId, user._id]);

  // Live read receipts → advance that user's read cursor.
  useEffect(() => {
    function handleRead({ conversationId, userId, readAt }) {
      if (conversationId !== convId) return;
      setLastReadAt((prev) => ({ ...prev, [userId]: readAt }));
    }
    socket.on("messagesRead", handleRead);
    return () => socket.off("messagesRead", handleRead);
  }, [convId]);

  // A message just got its first thread reply → flag it so we can show the
  // "thread exists" indicator live.
  useEffect(() => {
    function handleThreadUpdated({ messageId }) {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, hasThread: true } : m)),
      );
    }
    socket.on("threadUpdated", handleThreadUpdated);
    return () => socket.off("threadUpdated", handleThreadUpdated);
  }, []);

  // Send a message (optionally replying to `replyTo`).
  function send(payload, replyTo) {
    sendMessage({
      conversationId: convId,
      senderId: user._id,
      ...payload,
      replyTo: replyTo?._id || null,
    });
  }

  return { messages, send, loadOlder, hasMore, loadingOlder, lastReadAt };
}
