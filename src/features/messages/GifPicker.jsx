// ─────────────────────────────────────────────────────────────────────────
// GIF search popover (Tenor, via our backend /api/gifs). Type to search
// (debounced), click a thumbnail to send it. The parent closes the popover.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getGifs } from "../../shared/api/client.js";
import styles from "../../styles/GifPicker.module.css";

export default function GifPicker({ onPick }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [status, setStatus] = useState("Type to search GIFs");

  // Debounce: search 400 ms after the user stops typing.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setGifs([]);
      setStatus("Type to search GIFs");
      return;
    }
    setStatus("Searching…");
    const timer = setTimeout(() => {
      getGifs(q)
        .then((results) => {
          setGifs(results);
          setStatus(results.length ? "" : "No GIFs found");
        })
        .catch((e) => setStatus(e.message)); // e.g. "GIF search is not set up"
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className={styles.picker}>
      <input
        autoFocus
        className={styles.search}
        placeholder="Search Tenor GIFs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {status ? (
        <p className={styles.status}>{status}</p>
      ) : (
        <div className={styles.grid}>
          {gifs.map((gif) => (
            <button
              key={gif.id}
              className={styles.cell}
              onClick={() => onPick(gif.url)}
            >
              <img src={gif.preview} alt="GIF" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
