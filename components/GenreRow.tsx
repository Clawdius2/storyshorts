import Link from "next/link";
import styles from "./GenreRow.module.css";

const GENRES = [
  { label: "Mystery", emoji: "🔍" },
  { label: "Sci-Fi", emoji: "🚀" },
  { label: "Horror", emoji: "👻" },
  { label: "Romance", emoji: "💕" },
  { label: "Adventure", emoji: "⚔️" },
  { label: "Comedy", emoji: "😄" },
  { label: "Drama", emoji: "🎭" },
  { label: "Thriller", emoji: "🗡️" },
];

type GenreRowProps = {
  activeGenre?: string;
};

export function GenreRow({ activeGenre }: GenreRowProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className="eyebrow">Explore</p>
        <h2 className={styles.heading}>Browse by Genre</h2>
      </div>
      <div className={styles.grid}>
        {GENRES.map(({ label, emoji }) => (
          <Link
            key={label}
            href={`/catalog?genre=${encodeURIComponent(label)}`}
            className={`${styles.chip} ${activeGenre === label ? styles.active : ""}`}
          >
            <span className={styles.emoji}>{emoji}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}