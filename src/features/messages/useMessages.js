// ─────────────────────────────────────────────────────────────────────────
// Owns the messages of the open conversation.
//   • join the room + load the NEWEST page (REST) when the conversation changes
//   • loadOlder() fetches the previous page and prepends it (scroll up)
//   • append on "newMessage"
//   • on "messagesRead", advance that user's read cursor (ticks flip)
//   • on "threadUpdated", flag the parent so the thread indicator shows
//   • typing: notifyTyping() emits (throttled); "userTyping" → typingUser
// Returns the messages, a send(), typing helpers, and pagination helpers.
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages } from "../../shared/api/client.js";
import { mergeById, oldestFirst } from "../../shared/lib/merge.js";
import {
  socket,
  joinConversation,
  leaveConversation,
  sendMessage,
  editMessage,
  markAsRead,
  sendTyping,
} from "../../shared/realtime/socket.js";

const PAGE = 50;

export function useMessages(conversation, user) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Per-user read cursors { userId: lastReadTimestamp } → drives ✓✓ ticks.
  const [lastReadAt, setLastReadAt] = useState({});
  // Who is typing right now (name), or null.
  const [typingUser, setTypingUser] = useState(null);
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

    // MERGE the fetched page into state instead of replacing it — a live
    // socket message can land while this request is in flight, and replacing
    // would silently drop it (it only reappeared after a reload).
    function loadNewest() {
      if (cancelled) return;
      getMessages(convId, { limit: PAGE })
        .then((page) => {
          if (cancelled) return;
          setMessages((prev) => mergeById(prev, page).sort(oldestFirst));
          setHasMore(page.length === PAGE);
        })
        .catch(console.error);
    }

    // Fetch history only AFTER the server confirms we're in the room (ack).
    // Order then guarantees: saved before the fetch → in the page;
    // saved after → arrives live. Nothing can fall in between.
    const join = () => joinConversation(convId, loadNewest);
    join();

    // A reconnect gets a fresh socket with NO rooms — join again and reload
    // the newest page to catch anything missed while offline.
    socket.on("connect", join);

    return () => {
      cancelled = true;
      socket.off("connect", join);
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
      // Older page goes in front; mergeById drops any overlap at page edges.
      setMessages((prev) => mergeById(older, prev));
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
      if (senderId !== user._id) {
        markAsRead(convId, user._id);
        setTypingUser(null); // their message arrived — stop showing "typing…"
      }
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

  // A message was edited → swap the updated copy in place.
  useEffect(() => {
    function handleEdited(message) {
      if (message.conversationId !== convId) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m)),
      );
    }
    socket.on("messageEdited", handleEdited);
    return () => socket.off("messageEdited", handleEdited);
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

  // ── Typing indicator ──────────────────────────────────────────────────
  // Someone else is typing in THIS chat → show their name; hide it 3s after
  // their last "typing" event (each event restarts the timer).
  const typingTimerRef = useRef(null);
  useEffect(() => {
    setTypingUser(null); // reset when switching chats
    function handleTyping({ conversationId, userId, name }) {
      if (conversationId !== convId || userId === user._id) return;
      setTypingUser(name);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    }
    socket.on("userTyping", handleTyping);
    return () => {
      socket.off("userTyping", handleTyping);
      clearTimeout(typingTimerRef.current);
    };
  }, [convId, user._id]);

  // Tell others I'm typing — at most one emit per 2s no matter how fast I type.
  const lastTypingSentRef = useRef(0);
  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    sendTyping(convId, user._id, user.name);
  }, [convId, user._id, user.name]);

  // Send a message (optionally replying to `replyTo`).
  function send(payload, replyTo) {
    sendMessage({
      conversationId: convId,
      senderId: user._id,
      ...payload,
      replyTo: replyTo?._id || null,
    });
    setTypingUser(null); // my own send never hides behind a stale indicator
  }

  // Edit one of my own text messages (server validates + broadcasts).
  function edit(messageId, text) {
    editMessage({ messageId, senderId: user._id, text });
  }

  return {
    messages,
    send,
    edit,
    loadOlder,
    hasMore,
    loadingOlder,
    lastReadAt,
    typingUser,
    notifyTyping,
  };
}
