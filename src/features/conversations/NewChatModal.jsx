// ─────────────────────────────────────────────────────────────────────────
// Start a NEW conversation with existing users.
//   • Direct (1-to-1): pick one person
//   • Group: name it + pick two or more people
// We emit createConversation; the backend echoes "conversationCreated" to
// everyone involved — we catch it here, then select + close.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { socket, createConversation } from "../../shared/realtime/socket.js";
import Avatar from "../../shared/ui/Avatar.jsx";
import Modal from "../../shared/ui/Modal.jsx";
import styles from "../../styles/NewChatModal.module.css";

export default function NewChatModal({ currentUser, users, onClose, onCreated }) {
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const others = users.filter((u) => u._id !== currentUser._id);

  useEffect(() => {
    socket.on("conversationCreated", onCreated);
    return () => socket.off("conversationCreated", onCreated);
  }, [onCreated]);

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function pickMode(group) {
    setIsGroup(group);
    setSelectedIds([]);
  }

  function handleStart() {
    createConversation({
      name: isGroup ? groupName.trim() : null,
      isGroup,
      participants: [currentUser._id, ...selectedIds],
      createdBy: currentUser._id,
    });
  }

  const canStart = isGroup
    ? groupName.trim() && selectedIds.length >= 2
    : selectedIds.length === 1;

  return (
    <Modal title="New chat" onClose={onClose}>
      <div className={styles.tabs}>
        <button
          className={!isGroup ? styles.tabActive : styles.tab}
          onClick={() => pickMode(false)}
        >
          Direct
        </button>
        <button
          className={isGroup ? styles.tabActive : styles.tab}
          onClick={() => pickMode(true)}
        >
          Group
        </button>
      </div>

      {isGroup && (
        <input
          className={styles.groupName}
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      )}

      <p className={styles.hint}>
        {isGroup ? "Pick two or more people" : "Pick one person"}
      </p>

      <div className={styles.people}>
        {others.length === 0 && (
          <p className="muted center">No other users yet.</p>
        )}
        {others.map((u) => {
          const checked = selectedIds.includes(u._id);
          return (
            <button
              key={u._id}
              className={`${styles.person} ${checked ? styles.picked : ""}`}
              onClick={() => (isGroup ? toggle(u._id) : setSelectedIds([u._id]))}
            >
              <Avatar name={u.name} size={36} />
              <span className={styles.personName}>{u.name}</span>
              {checked && <span className={styles.check}>✓</span>}
            </button>
          );
        })}
      </div>

      <button
        className={styles.start}
        disabled={!canStart}
        onClick={handleStart}
      >
        Start chat
      </button>
    </Modal>
  );
}
