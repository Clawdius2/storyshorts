import styles from "./ValueStrip.module.css";

const FEATURES = [
  {
    icon: "▶",
    title: "Instant streaming",
    copy: "No downloads. Tap a title and start listening immediately on any device.",
  },
  {
    icon: "✦",
    title: "Premium narration",
    copy: "Every story is produced with care — realistic voices, clean audio, no filler.",
  },
  {
    icon: "★",
    title: "Resume anywhere",
    copy: "Your listening position is saved. Pick up exactly where you left off.",
  },
  {
    icon: "◆",
    title: "Curated classics",
    copy: "Hand-picked public-domain stories across every genre, ready to stream.",
  },
];

export function ValueStrip() {
  return (
    <section className={styles.strip}>
      {FEATURES.map((f) => (
        <div key={f.title} className={styles.item}>
          <div className={styles.icon}>{f.icon}</div>
          <div>
            <strong>{f.title}</strong>
            <p>{f.copy}</p>
          </div>
        </div>
      ))}
    </section>
  );
}