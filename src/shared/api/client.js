// ─────────────────────────────────────────────────────────────────────────
// REST API client. REST is used for LOADING DATA (history) and file upload.
// Live actions go through realtime/socket.js instead.
// ─────────────────────────────────────────────────────────────────────────
import { API_URL } from "../config.js";

const BASE = `${API_URL}/api`;

// One wrapper so every call parses JSON and throws on HTTP errors.
async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────
// Returns names + ids only — the phone number is a secret used for login.
export const getUsers = () => request("/users");

export const createUser = (name, phoneNumber) =>
  request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phoneNumber }),
  });

// Log in as an existing user by proving the phone number (the secret).
export const loginUser = (userId, phoneNumber) =>
  request("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, phoneNumber }),
  });

// ── Conversations & messages (history, cursor-paginated) ────────────────────
// `before` is an ISO date cursor → returns the page OLDER than it.
// Omit `before` for the newest page.
function withQuery(path, params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, v);
  });
  const str = qs.toString();
  return str ? `${path}?${str}` : path;
}

export const getConversations = (userId, { before, limit = 20 } = {}) =>
  request(withQuery(`/conversations/${userId}`, { before, limit }));

export const getMessages = (conversationId, { before, limit = 50 } = {}) =>
  request(withQuery(`/messages/${conversationId}`, { before, limit }));

// Thread replies belonging to one parent message.
export const getThreadMessages = (messageId) =>
  request(`/messages/${messageId}/thread`);

// ── File upload ─────────────────────────────────────────────────────────────
// Multipart form-data. Backend uploads to Cloudinary, returns { url }.
export function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}
