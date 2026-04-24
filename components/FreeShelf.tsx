import type { Book } from "@prisma/client";
import { BookCard } from "@/components/BookCard";
import styles from "./FreeShelf.module.css";

export function FreeShelf({
  books,
  hasSubscription,
}: {
  books: Book[];
  hasSubscription: boolean;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Free shelf</p>
          <h2>Five stories anyone can stream right now.</h2>
        </div>
        <p className={styles.copy}>
          Start with the classics. No account or subscription is required for these five titles.
        </p>
      </div>
      <div className={styles.grid}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} hasSubscription={hasSubscription} />
        ))}
      </div>
    </section>
  );
}
