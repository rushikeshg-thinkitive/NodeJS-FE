// ─────────────────────────────────────────────────────────────────────────
// Login. The phone number works like a password:
//   • Existing user → pick your name, then type your phone to verify (loginUser).
//   • New user → enter name + phone (createUser); a phone already in use is
//     rejected, so you can't create a duplicate.
// The user list shows names only — phones are never sent to the client.
// Either path ends with onLogin(user), which saves them and opens the chat.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getUsers, createUser, loginUser } from "../../shared/api/client.js";
import Avatar from "../../shared/ui/Avatar.jsx";
import styles from "../../styles/LoginScreen.module.css";

export default function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null); // the name card being verified
  const [verifyPhone, setVerifyPhone] = useState(""); // phone typed to log in
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);

  function pick(user) {
    setSelected(user);
    setVerifyPhone("");
    setError("");
  }

  // Existing user: verify the typed phone against the picked name.
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await loginUser(selected._id, verifyPhone.trim());
      onLogin(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // New user: create (backend rejects an already-used phone).
  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await createUser(name.trim(), phone.trim());
      onLogin(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>💬</span>
          <h1>Chat</h1>
          <p className="muted">Pick who you are to start chatting.</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {users.length > 0 && (
          <>
            <h3 className={styles.label}>
              👥 {users.length} {users.length === 1 ? "person" : "people"} here
            </h3>
            <div className={styles.userList}>
              {users.map((u) => {
                const isSelected = selected?._id === u._id;
                return (
                  <div key={u._id} className={styles.userRow}>
                    <button
                      className={`${styles.userPick} ${isSelected ? styles.userPickActive : ""}`}
                      onClick={() => pick(u)}
                    >
                      <Avatar name={u.name} size={40} />
                      <span className={styles.userInfo}>
                        <strong>{u.name}</strong>
                      </span>
                      <span className={styles.go}>→</span>
                    </button>

                    {isSelected && (
                      <form className={styles.verify} onSubmit={handleLogin}>
                        <input
                          type="tel"
                          autoFocus
                          placeholder="Enter your phone to log in"
                          value={verifyPhone}
                          onChange={(e) => setVerifyPhone(e.target.value)}
                          required
                        />
                        <button
                          type="submit"
                          className={styles.verifyGo}
                          disabled={busy || !verifyPhone.trim()}
                        >
                          {busy ? "…" : "Go"}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.divider}>
              <span>or create new</span>
            </div>
          </>
        )}

        <form onSubmit={handleCreate} className={styles.form}>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button
            type="submit"
            className={styles.submit}
            disabled={busy || !name.trim() || !phone.trim()}
          >
            {busy ? "Creating…" : "Create & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
