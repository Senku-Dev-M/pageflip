"use client";

import Image from "next/image";
import { useMemo } from "react";

import { useBookHistory } from "@/modules/catalog/hooks/useBookHistory";
import { formatLoanHistory } from "@/modules/catalog/utils/bookLoans";

import styles from "./HistoryPage.module.css";

const FALLBACK_COLORS = ["#1dd3bf", "#14b8a6", "#ec4899", "#2b3546", "#3f4a63", "#1a202c"];

export default function HistoryPage() {
  const { userReturnedBooks } = useBookHistory();

  const returnedBooks = useMemo(() => {
    return userReturnedBooks.map((loan, index) => {
      const history = formatLoanHistory(
        loan.borrowedAt,
        loan.dueDate,
        loan.returnedAt ?? undefined,
      );

      return {
        loan,
        history,
        cover: loan.cover ?? null,
        fallbackColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        initials: loan.title.slice(0, 2).toUpperCase(),
      };
    });
  }, [userReturnedBooks]);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <p className={styles.kicker}>History</p>
        <h1 className={styles.title}>
          {returnedBooks.length === 0 ? "Reading History" : `${returnedBooks.length} Books Returned`}
        </h1>
        <p className={styles.subtitle}>
          All the books you&apos;ve borrowed and returned from our library.
        </p>
      </header>
      <div className={styles.panel}>
        {returnedBooks.length === 0 ? (
          <div className={styles.emptyState}>
            No returned books yet. Start borrowing to see your reading history here.
          </div>
        ) : (
          <ul className={styles.list}>
            {returnedBooks.map(({ loan, cover, fallbackColor, history, initials }) => (
              <li key={loan.id} className={styles.historyCard}>
                <div className={styles.bookVisual}>
                  {cover ? (
                    <Image
                      src={cover}
                      alt={`Cover of ${loan.title}`}
                      fill
                      sizes="(max-width: 768px) 40vw, 96px"
                      className={styles.bookCoverImage}
                      priority={false}
                    />
                  ) : (
                    <div
                      className={styles.bookVisualFallback}
                      style={{ backgroundColor: fallbackColor }}
                    >
                      <span>{initials}</span>
                    </div>
                  )}
                  <div className={styles.bookVisualGlow} />
                </div>
                <div className={styles.bookBody}>
                  <div className={styles.bookHeader}>
                    <div>
                      <h2 className={styles.bookTitle}>{loan.title}</h2>
                      <p className={styles.bookAuthor}>{loan.author}</p>
                    </div>
                    <span className={styles.returnedChip} aria-label="Book returned">
                      Returned
                    </span>
                  </div>
                  <div className={styles.bookMeta}>
                    <span>
                      <span className={styles.metaLabel}>Borrowed:</span>
                      {history.loanDate}
                    </span>
                    {history.dueDate && (
                      <span>
                        <span className={styles.metaLabel}>Due:</span>
                        {history.dueDate}
                      </span>
                    )}
                    {history.returnedDate && (
                      <span>
                        <span className={styles.metaLabel}>Returned:</span>
                        {history.returnedDate}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
