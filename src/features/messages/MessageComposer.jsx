// ─────────────────────────────────────────────────────────────────────────
// Reusable composer — used by both the main chat and threads.
// Owns text + file upload + emoji picker + GIF search, then calls
//     onSend({ type, text?, fileUrl?, fileName? })
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
}) {
  const [text, setText] = useState("");
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

  function togglePanel(name) {
    setPanel((current) => (current === name ? null : name));
  }

  function handleChange(e) {
    setText(e.target.value);
    onTyping?.(); // let others see "… is typing"
  }

  function submitText(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ type: "text", text: trimmed });
    setText("");
    setPanel(null);
  }

  function handleGif(url) {
    // A GIF is just an animated image — reuse the whole image pipeline.
    onSend({ type: "image", fileUrl: url, fileName: "GIF" });
    setPanel(null);
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      onSend({
        type: file.type.startsWith("image/") ? "image" : "file",
        fileUrl: url,
        fileName: file.name,
      });
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = "";
    }
  }

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

      <form className={styles.bar} onSubmit={submitText}>
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
        >
          GIF
        </IconButton>
        <IconButton
          label="Attach file"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading ? "…" : "📎"}
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
          disabled={!text.trim()}
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
