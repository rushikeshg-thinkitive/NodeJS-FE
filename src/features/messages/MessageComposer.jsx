// ─────────────────────────────────────────────────────────────────────────
// Reusable composer — used by both the main chat and threads.
// Owns text + file attach + emoji picker + GIF search, then calls
//     onSend({ type, text?, fileUrl?, fileName? })
// Picking a file does NOT upload it — it shows a preview above the bar with
// a ✕ to cancel; the upload happens only when the user presses send.
// The parent attaches ids / replyTo. Optionally shows a reply preview.
// `onTyping` (optional) is called as the user types → typing indicator.
// ─────────────────────────────────────────────────────────────────────────
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { uploadFile } from "../../shared/api/client.js";
import IconButton from "../../shared/ui/IconButton.jsx";
import GifPicker from "./GifPicker.jsx";
import styles from "../../styles/MessageComposer.module.css";

// The emoji picker is ~200 kB, so load it only when first opened.
const EmojiPicker = lazy(() => import("emoji-picker-react"));

export default function MessageComposer({
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
  editing, // my message being edited (main chat only)
  onCancelEdit,
}) {
  const [text, setText] = useState("");
  // File chosen but not sent yet — { file, previewUrl (images only) }
  const [pending, setPending] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Which popover is open: null | "emoji" | "gif"
  const [panel, setPanel] = useState(null);
  const fileRef = useRef(null);
  const wrapRef = useRef(null);

  // Close the open popover when clicking anywhere outside the composer.
  useEffect(() => {
    if (!panel) return;
    function handleClickAway(e) {
      if (!wrapRef.current?.contains(e.target)) setPanel(null);
    }
    document.addEventListener("pointerdown", handleClickAway);
    return () => document.removeEventListener("pointerdown", handleClickAway);
  }, [panel]);

  // Entering edit mode pre-fills the input with the message text;
  // leaving it (cancel or done) clears the input.
  useEffect(() => {
    setText(editing ? editing.text : "");
  }, [editing]);

  function togglePanel(name) {
    setPanel((current) => (current === name ? null : name));
  }

  function handleChange(e) {
    setText(e.target.value);
    onTyping?.(); // let others see "… is typing"
  }

  // Picking a file only STAGES it (nothing uploads until send).
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    clearPending(); // replacing a previous pick
    setPending({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    });
    fileRef.current.value = ""; // allow re-picking the same file later
  }

  function clearPending() {
    setPending((p) => {
      if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl); // free memory
      return null;
    });
  }

  // Send = staged file first (upload now), then any typed text.
  // In edit mode only the text path runs (attachments are disabled).
  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();

    if (pending && !editing) {
      setUploading(true);
      try {
        const { url } = await uploadFile(pending.file);
        onSend({
          type: pending.file.type.startsWith("image/") ? "image" : "file",
          fileUrl: url,
          fileName: pending.file.name,
        });
        clearPending();
      } catch (err) {
        alert("Upload failed: " + err.message);
        return; // keep the preview so the user can retry or cancel
      } finally {
        setUploading(false);
      }
    }

    if (trimmed) {
      onSend({ type: "text", text: trimmed });
      setText("");
    }
    setPanel(null);
  }

  function handleGif(url) {
    // A GIF is just an animated image — reuse the whole image pipeline.
    onSend({ type: "image", fileUrl: url, fileName: "GIF" });
    setPanel(null);
  }

  const canSend = (text.trim() || pending) && !uploading;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {replyingTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyBody}>
            <strong>{replyingTo.senderId?.name || "Message"}</strong>
            <span>{replyingTo.text || `[${replyingTo.type}]`}</span>
          </div>
          <IconButton label="Cancel reply" onClick={onCancelReply}>
            ✕
          </IconButton>
        </div>
      )}

      {/* Edit mode banner — same layout as the reply preview */}
      {editing && (
        <div className={styles.replyPreview}>
          <div className={styles.replyBody}>
            <strong>✏️ Editing message</strong>
            <span>{editing.text}</span>
          </div>
          <IconButton label="Cancel edit" onClick={onCancelEdit}>
            ✕
          </IconButton>
        </div>
      )}

      {/* Staged file — preview + cancel; uploads only on send */}
      {pending && (
        <div className={styles.filePreview}>
          {pending.previewUrl ? (
            <img
              className={styles.fileThumb}
              src={pending.previewUrl}
              alt={pending.file.name}
            />
          ) : (
            <span className={styles.fileIcon}>📎</span>
          )}
          <span className={styles.fileName}>{pending.file.name}</span>
          <IconButton
            label="Remove attachment"
            onClick={clearPending}
            disabled={uploading}
          >
            ✕
          </IconButton>
        </div>
      )}

      {panel === "emoji" && (
        <div className={styles.popover}>
          <Suspense fallback={<p className={styles.loading}>Loading emoji…</p>}>
            <EmojiPicker
              width="100%"
              height={340}
              theme={
                document.documentElement.dataset.theme === "dark"
                  ? "dark"
                  : "light"
              }
              searchDisabled={false}
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
              onEmojiClick={(emoji) => setText((t) => t + emoji.emoji)}
            />
          </Suspense>
        </div>
      )}

      {panel === "gif" && (
        <div className={styles.popover}>
          <GifPicker onPick={handleGif} />
        </div>
      )}

      <form className={styles.bar} onSubmit={handleSubmit}>
        <input
          type="file"
          ref={fileRef}
          className={styles.hidden}
          onChange={handleFile}
        />
        <IconButton label="Emoji" onClick={() => togglePanel("emoji")}>
          😊
        </IconButton>
        <IconButton
          label="GIF"
          className={styles.gifBtn}
          onClick={() => togglePanel("gif")}
          disabled={!!editing}
        >
          GIF
        </IconButton>
        <IconButton
          label="Attach file"
          onClick={() => fileRef.current.click()}
          disabled={uploading || !!editing}
        >
          📎
        </IconButton>

        <input
          className={styles.input}
          placeholder="Type a message"
          value={text}
          onChange={handleChange}
        />

        <button
          type="submit"
          className={styles.send}
          disabled={!canSend}
          aria-label="Send"
        >
          {uploading ? "…" : "➤"}
        </button>
      </form>
    </div>
  );
}
