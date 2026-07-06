// Combine two lists of documents without duplicates (matched by _id).
// Items already in `current` win over `incoming` copies — the live socket
// version is always at least as fresh as a fetched page.
// Used everywhere a REST page meets live socket data, so a message that
// arrives during a fetch is never lost (the "reload to see it" bug).
export function mergeById(current, incoming) {
  const seen = new Set(current.map((item) => item._id));
  return [...current, ...incoming.filter((item) => !seen.has(item._id))];
}

// Sort helpers for the two list shapes we render.
export const oldestFirst = (a, b) =>
  new Date(a.createdAt) - new Date(b.createdAt); // messages & replies

export const newestFirst = (a, b) =>
  new Date(b.lastMessageAt) - new Date(a.lastMessageAt); // conversation list
