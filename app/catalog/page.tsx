import { auth } from "@clerk/nextjs/server";
import { BookCard } from "@/components/BookCard";
import { GenreFilter } from "@/components/GenreFilter";
import { SearchForm } from "@/components/SearchForm";
import { getCatalogBooks, getGenres } from "@/lib/books";
import { hasActiveSubscription } from "@/lib/subscriptions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; q?: string }>;
}) {
  const [{ genre, q }, { userId }] = await Promise.all([searchParams, auth()]);
  const [books, genres, subscribed] = await Promise.all([
    getCatalogBooks({
      genre,
      query: q,
    }),
    getGenres(),
    hasActiveSubscription(userId),
  ]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Browse the full StoryShorts library.</h1>
        </div>
        <p className={styles.copy}>
          Search by title, author, or narrator. Free titles are marked clearly, while premium
          stories unlock with an active membership.
        </p>
      </section>

      <section className={styles.controls}>
        <SearchForm genre={genre} initialQuery={q} />
        <GenreFilter activeGenre={genre} genres={genres} query={q} />
      </section>

      {books.length > 0 ? (
        <section className={styles.grid}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} hasSubscription={subscribed} />
          ))}
        </section>
      ) : (
        <div className="emptyState">
          <h2>No titles matched that search.</h2>
          <p>Try a different keyword or switch back to the full catalog.</p>
        </div>
      )}
    </div>
  );
}
