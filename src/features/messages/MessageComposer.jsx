// ─────────────────────────────────────────────────────────────────────────
// Reusable composer — used by both the main chat and threads.
// Owns text + file upload (uploads via REST, picks image vs file), then calls
//     onSend({ type, text?, fileUrl?, fileName? })
// The parent attaches ids / replyTo. Optionally shows a reply preview.
// ─────────────────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import { uploadFile } from "../../shared/api/client.js";
import IconButton from "../../shared/ui/IconButton.jsx";
import styles from "../../styles/MessageComposer.module.css";

export default function MessageComposer({ onSend, replyingTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  function submitText(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ type: "text", text: trimmed });
    setText("");
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
    <div className={styles.wrap}>
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

      <form className={styles.bar} onSubmit={submitText}>
        <input
          type="file"
          ref={fileRef}
          className={styles.hidden}
          onChange={handleFile}
        />
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
          onChange={(e) => setText(e.target.value)}
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
