// ─────────────────────────────────────────────────────────────────────────
// Owns the conversation list (the live left pane).
//   • loads the NEWEST page via REST (getConversations)
//   • loadMore() fetches the previous page and appends it (scroll down)
//   • registers us on the socket
//   • upserts + re-sorts on conversationCreated / conversationUpdated
// ─────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { getConversations } from "../../shared/api/client.js";
import { mergeById, newestFirst } from "../../shared/lib/merge.js";
import { socket, registerUser } from "../../shared/realtime/socket.js";

const PAGE = 20;

// Insert/replace a conversation by _id, then sort newest-first.
function upsertSorted(list, conv) {
  const others = list.filter((c) => c._id !== conv._id);
  return [conv, ...others].sort(newestFirst);
}

export function useConversations(user) {
  const [conversations, setConversations] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const listRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  useEffect(() => {
    listRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Load the newest page + register once.
  useEffect(() => {
    let cancelled = false;
    setConversations([]); // a different user starts with a clean list

    // Merge (don't replace) — a live conversationUpdated can land while the
    // fetch runs; the socket version is fresher, so keep it over the page's.
    function loadNewest() {
      getConversations(user._id, { limit: PAGE })
        .then((page) => {
          if (cancelled) return;
          setConversations((prev) => mergeById(prev, page).sort(newestFirst));
          setHasMore(page.length === PAGE);
        })
        .catch(console.error);
    }

    registerUser(user._id);
    loadNewest();
    // After a reconnect, refresh the list to catch bumps missed while offline
    // (registerUser is re-sent by the socket module itself).
    socket.on("connect", loadNewest);
    return () => {
      cancelled = true;
      socket.off("connect", loadNewest);
    };
  }, [user._id]);

  // Fetch the previous (older) page and append it.
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    const list = listRef.current;
    const last = list[list.length - 1];
    if (!last) return;

    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const older = await getConversations(user._id, {
        before: last.lastMessageAt,
        limit: PAGE,
      });
      // Merge + dedupe by _id (a live bump could overlap a page boundary).
      setConversations((prev) => mergeById(prev, older).sort(newestFirst));
      setHasMore(older.length === PAGE);
    } catch (e) {
      console.error(e);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [user._id]);

  // Live updates from our personal room (new chat / new message bumps it).
  useEffect(() => {
    const upsert = (conv) =>
      setConversations((prev) => upsertSorted(prev, conv));
    socket.on("conversationCreated", upsert);
    socket.on("conversationUpdated", upsert);
    return () => {
      socket.off("conversationCreated", upsert);
      socket.off("conversationUpdated", upsert);
    };
  }, []);

  return { conversations, loadMore, hasMore, loadingMore };
}
