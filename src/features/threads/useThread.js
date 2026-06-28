// ─────────────────────────────────────────────────────────────────────────
// Owns one thread's replies.
//   • join the thread room + load history (REST) when opened
//   • append on "newThreadMessage"
// Returns the replies and a send() that emits sendThreadMessage.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getThreadMessages } from "../../shared/api/client.js";
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
    joinThread(parentId);
    getThreadMessages(parentId).then(setReplies).catch(console.error);
    return () => leaveThread(parentId);
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
