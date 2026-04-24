import Link from "next/link";
import styles from "./GenreFilter.module.css";

type GenreFilterProps = {
  activeGenre?: string;
  genres: string[];
  query?: string;
};

function createHref(genre: string, query?: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (genre !== "All") {
    params.set("genre", genre);
  }

  const search = params.toString();
  return search ? `/catalog?${search}` : "/catalog";
}

export function GenreFilter({ activeGenre = "All", genres, query }: GenreFilterProps) {
  const items = ["All", ...genres];

  return (
    <div className={styles.row} aria-label="Genres">
      {items.map((genre) => (
        <Link
          key={genre}
          href={createHref(genre, query)}
          className={`${styles.chip} ${genre === activeGenre ? styles.active : ""}`}
        >
          {genre}
        </Link>
      ))}
    </div>
  );
}
