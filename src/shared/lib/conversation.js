// Pure helpers for conversation/message data. No React, easy to test/read.

// Display title of a conversation.
//   • group  → its name
//   • 1-to-1 → the OTHER participant's name
// The backend always sends populated participants (REST + socket), so we can
// just read `.name` — no lookups needed.
export function conversationTitle(conversation, currentUser) {
  if (conversation.isGroup) return conversation.name || "Group";

  const other = (conversation.participants || []).find(
    (p) => p._id !== currentUser._id,
  );
  return other?.name || "Me";
}

// Participants as plain id strings.
export function participantIdsOf(conversation) {
  return (conversation?.participants || []).map((p) =>
    typeof p === "string" ? p : p._id,
  );
}

// Unread count for a user. unreadCounts is a Mongoose Map → JSON object.
export function unreadFor(conversation, userId) {
  return conversation?.unreadCounts?.[userId] || 0;
}

// For one of MY messages: have ALL the other participants read it?
// A participant has read it when their read cursor (lastReadAt) is at or past
// the message's time. Drives ✓ (sent) vs ✓✓ (read).
export function isReadByOthers(message, lastReadAt, participantIds, myId) {
  const others = participantIds.filter((id) => id !== myId);
  if (others.length === 0) return false;
  const sentAt = new Date(message.createdAt).getTime();
  return others.every((id) => {
    const readAt = lastReadAt?.[id];
    return readAt && new Date(readAt).getTime() >= sentAt;
  });
}

// The id of a message's sender, whether populated or a raw string.
export function senderIdOf(message) {
  return typeof message.senderId === "string"
    ? message.senderId
    : message.senderId?._id;
}
