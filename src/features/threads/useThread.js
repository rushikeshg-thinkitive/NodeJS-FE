// ─────────────────────────────────────────────────────────────────────────
// Owns one thread's replies.
//   • join the thread room + load history (REST) when opened
//   • append on "newThreadMessage"
// Returns the replies and a send() that emits sendThreadMessage.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getThreadMessages } from "../../shared/api/client.js";
import { mergeById, oldestFirst } from "../../shared/lib/merge.js";
import {
  socket,
  joinThread,
  leaveThread,
  sendThreadMessage,
} from "../../shared/realtime/socket.js";

export function useThread(parent, conversation, user) {
  const [replies, setReplies] = useState([]);
  const parentId = parent._id;

  useEffect(() => {
    let cancelled = false;
    setReplies([]); // switching threads starts clean

    // Merge (don't replace) — a live reply can land while the fetch runs.
    function load() {
      if (cancelled) return;
      getThreadMessages(parentId)
        .then((list) => {
          if (cancelled) return;
          setReplies((prev) => mergeById(prev, list).sort(oldestFirst));
        })
        .catch(console.error);
    }

    // Load history only after the join is confirmed; re-join on reconnect.
    const join = () => joinThread(parentId, load);
    join();
    socket.on("connect", join);

    return () => {
      cancelled = true;
      socket.off("connect", join);
      leaveThread(parentId);
    };
  }, [parentId]);

  useEffect(() => {
    function handleNew(message) {
      if (message.threadId === parentId) {
        setReplies((prev) => [...prev, message]);
      }
    }
    socket.on("newThreadMessage", handleNew);
    return () => socket.off("newThreadMessage", handleNew);
  }, [parentId]);

  function send(payload) {
    sendThreadMessage({
      threadId: parentId,
      conversationId: conversation._id,
      senderId: user._id,
      ...payload,
    });
  }

  return { replies, send };
}
