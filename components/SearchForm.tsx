import styles from "./SearchForm.module.css";

export function SearchForm({
  genre,
  initialQuery,
}: {
  genre?: string;
  initialQuery?: string;
}) {
  return (
    <form action="/catalog" className={styles.form}>
      {genre ? <input type="hidden" name="genre" value={genre} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder="Search by title, author, narrator..."
        className={styles.input}
        aria-label="Search books"
      />
      <button type="submit" className="buttonPrimary">
        Search
      </button>
    </form>
  );
}
