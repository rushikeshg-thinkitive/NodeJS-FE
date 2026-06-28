// Central place for the backend URL so we never hardcode it across the app.
// Comes from .env (VITE_API_URL). Falls back to localhost for convenience.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Turn a stored file path into a usable URL.
// Cloudinary already returns a full https URL → use it as-is.
// Older local uploads start with "/" → prefix the backend URL.
export function fileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
