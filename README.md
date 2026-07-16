# Chat App — Frontend (React + Vite)

A modern, real-time chat UI for the [`Websocket`](../Websocket) backend.
Live conversation list on the left, live chat on the right.

**Features:** 1-to-1 chat, group chat, image/file sharing (Cloudinary),
**emoji picker**, **GIF search (Tenor)**, **typing indicator**, **unread badges**,
**read receipts (✓✓)**, **reply / quote**, and **threads**.
**Light / dark theme** toggle. Fully **responsive** — one pane at a time on phones,
two panes on tablet/laptop, with iOS-Safari-safe layout.

> Lightweight login in V1 — your **phone number is your password**. To log in you pick
> your name and type your phone (verified server-side); to join you create a name + phone.
> Phone numbers are never shown in the UI. The logged-in user is saved in your browser.

---

## Tech

- **React 18** + **Vite**
- **socket.io-client** for real-time events
- **CSS Modules** per component + one global **design-tokens** file (`src/styles/tokens.css`)
  that drives the light/dark themes — no UI framework.

---

## Setup & run

```bash
npm install

# Point the app at the backend in .env:
#   VITE_API_URL=http://localhost:5000   (or your deployed URL)

npm run dev
```

Open **http://localhost:5173**. Other scripts: `npm run build`, `npm run preview`.

---

## How to use it

1. **Log in** on the login screen: pick your name and type your phone number, **or** create
   a new user (name + phone). The phone is your password — a phone already in use can't be
   re-created. (Refreshing keeps you logged in.)
2. Click **＋ New chat** → **Direct** (one person) or **Group** (name + 2+ people).
3. Type a message and press send, or click **📎** for an image/file.
4. Hover a message (or tap on mobile) → **↩ Reply** or **🧵 Open thread**.
5. Toggle **🌙 / ☀️** in the sidebar header for dark/light mode.
6. See it live: open a second browser window, log in as another user, and chat —
   messages, unread badges, and read ticks update instantly.

---

## Architecture (feature-based)

Each feature owns its components (+ scoped `.module.css`) and a hook that holds its
socket/data logic, so components stay presentational.

```
src/
  main.jsx                  React entry (imports global css)
  App.jsx                   Login vs AppShell + theme owner
  styles/
    tokens.css              Design tokens + dark-theme overrides
    global.css              Reset, base, iOS rules
  shared/                   Cross-feature building blocks
    config.js               API_URL + fileUrl (Cloudinary-aware)
    api/client.js           REST calls (users, conversations, messages, upload)
    realtime/socket.js      One socket.io connection + emit helpers
    lib/conversation.js     title, participant ids, unread, read-ticks logic
    lib/format.js           time / day / avatar-color helpers
    hooks/                  useLocalStorage, useTheme
    ui/                     Avatar, IconButton, Modal, EmptyState
  app/
    AppShell.jsx            Chat shell: selection, open thread, responsive panes
  features/
    auth/                   useAuth, LoginScreen
    conversations/          useConversations, ConversationList, ConversationItem, NewChatModal
    messages/               useMessages, ChatView, MessageList, MessageBubble, MessageComposer
    threads/                useThread, ThreadPanel
```

### REST vs Socket — one simple rule

**Loading data = REST** (`shared/api/client.js`) · **live actions = Socket**
(`shared/realtime/socket.js`).

| We listen for          | What we do                                              |
| ---------------------- | ------------------------------------------------------ |
| `conversationCreated`  | Add the chat to the sidebar (open it if it's ours)     |
| `conversationUpdated`  | Re-sort the sidebar; refresh the unread badge          |
| `newMessage`           | Append the message to the open chat                    |
| `messagesRead`         | Flip my ✓ ticks to ✓✓ when the other side reads        |
| `userTyping`           | Show "name is typing…" in the chat header for ~3s      |
| `newThreadMessage`     | Append a reply inside the open thread panel            |
| `threadUpdated`        | Show the "View thread" indicator on a message live     |

> Conversations arrive with **participants populated** (names included) over both REST and
> socket, so the UI just reads `.name` — no client-side user lookup needed.

We emit: `registerUser`, `createConversation`, `joinConversation`/`leaveConversation`,
`sendMessage` (carries `replyTo`), `markAsRead`, `typing` (throttled to one emit
per 2s while typing), `joinThread`/`leaveThread`, `sendThreadMessage`.

> We don't add our own sent messages to the screen directly — the backend echoes every
> message back via `newMessage`, so there's one source of truth.

> **No lost messages:** history is fetched only after the server *acks* the room join,
> fetched pages are **merged** (never replace live state — `shared/lib/merge.js`), and a
> reconnect automatically re-joins the room + reloads the newest page.

### Feature cheat sheet

| Feature        | UI                                                | Code |
| -------------- | ------------------------------------------------- | ---- |
| File preview   | 📎 stages the file (thumbnail / name + ✕ cancel); it uploads only when you press send | `messages/MessageComposer.jsx` |
| Emoji          | 😊 opens a full picker (emoji-picker-react, lazy-loaded); emoji are just text | `messages/MessageComposer.jsx` |
| GIFs           | GIF button → Tenor search grid (via BE `/gifs` proxy); sends as an `image` message | `messages/GifPicker.jsx` + `MessageComposer.jsx` |
| Typing         | "name is typing…" in the header while the other side types (ephemeral socket relay) | `useMessages.js` (`typingUser`/`notifyTyping`) + `ChatView.jsx` |
| Unread badges  | Count pill on a conversation; clears on open      | `conversations/ConversationItem.jsx` + `unreadFor()` |
| Read receipts  | ✓ sent → ✓✓ read; compares each message's time to per-user read cursors (`lastReadAt`) | `messages/MessageBubble.jsx` + `isReadByOthers()` + `useMessages.js` |
| Reply / quote  | Hover → ↩ Reply; quoted block shown in the bubble | `messages/ChatView.jsx`, `MessageComposer.jsx`, `MessageBubble.jsx` |
| Threads        | Hover → 🧵; drawer (desktop) / full-screen (phone)| `threads/ThreadPanel.jsx` + `useThread.js` |
| Thread indicator | "🧵 View thread" chip on messages that have replies (BE `hasThread` + `threadUpdated`) | `messages/MessageBubble.jsx` + `useMessages.js` |
| Pagination     | Messages: newest 50, scroll **up** for older 50 (position kept). Conversations: newest 20, scroll **down** for older 20. Cursor-based (`?before=&limit=`) | `useMessages.js`/`MessageList.jsx`, `useConversations.js`/`ConversationList.jsx` |
| Dark mode      | 🌙/☀️ toggle; persists in localStorage             | `shared/hooks/useTheme.js` + `styles/tokens.css` |
| Responsive     | One pane on phone, two on tablet/laptop           | `app/AppShell.module.css` media queries |

---

## Mobile / iOS notes

The layout is built to not break on iPhone Safari: `100dvh` height, `env(safe-area-inset-*)`
padding, 16px inputs (no zoom-on-focus), contained scrolling, and `viewport-fit=cover`.

---

## Troubleshooting

- **Nothing loads / network errors** → is the backend reachable at `VITE_API_URL`?
- **Messages don't arrive live** → both users need the chat open; the socket connects on load.
- **Images don't show** → uploads go to Cloudinary; the returned URL is used directly.
- **CORS** → the backend whitelists dev ports + the deployed origin in `src/socket/socket.js`.
```

