// ─────────────────────────────────────────────────────────────────────────
// Socket.IO connection (real-time). One shared socket for the whole app,
// plus small helpers so components don't have to remember event names.
//
// Socket = LIVE ACTIONS (things others must see instantly):
//   register · create conversation · join/leave rooms · send message ·
//   mark as read · threads.
// ─────────────────────────────────────────────────────────────────────────
import { io } from "socket.io-client";
import { API_URL } from "../config.js";

export const socket = io(API_URL, { autoConnect: true });

// Remember who we are so we re-register automatically after a reconnect.
let currentUserId = null;

export function registerUser(userId) {
  currentUserId = userId;
  socket.emit("registerUser", { userId });
}

socket.on("connect", () => {
  if (currentUserId) socket.emit("registerUser", { userId: currentUserId });
});

// ── Conversation rooms ──────────────────────────────────────────────────────
// `onJoined` fires once the server CONFIRMS the join (socket.io ack) — load
// history in it so no message can slip between "fetched" and "in the room".
export const joinConversation = (conversationId, onJoined) =>
  socket.emit("joinConversation", { conversationId }, onJoined);

export const leaveConversation = (conversationId) =>
  socket.emit("leaveConversation", { conversationId });

export const createConversation = (data) =>
  socket.emit("createConversation", data);

// `data` may also include `replyTo` (id of the quoted message).
export const sendMessage = (data) => socket.emit("sendMessage", data);

// Reset our unread count + mark messages read (turns others' ticks blue).
export const markAsRead = (conversationId, userId) =>
  socket.emit("markAsRead", { conversationId, userId });

// "I'm typing" — the server relays it to everyone else in the conversation.
export const sendTyping = (conversationId, userId, name) =>
  socket.emit("typing", { conversationId, userId, name });

// ── Threads (a side-conversation off one parent message) ────────────────────
export const joinThread = (messageId, onJoined) =>
  socket.emit("joinThread", { messageId }, onJoined);
export const leaveThread = (messageId) =>
  socket.emit("leaveThread", { messageId });

// `data.threadId` is the parent message id.
export const sendThreadMessage = (data) =>
  socket.emit("sendThreadMessage", data);
