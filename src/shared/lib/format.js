// Small formatting helpers shared across features.

// "2:31 PM" — short clock time for a message/conversation.
export function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "Today" / "Yesterday" / "Jun 3, 2026" — used for date separators.
export function formatDay(date) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// First letter of a name, for avatars.
export function initial(name) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

// Deterministic avatar color from a name (so each person keeps one color).
const AVATAR_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
];
export function avatarColor(name) {
  const str = name || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
