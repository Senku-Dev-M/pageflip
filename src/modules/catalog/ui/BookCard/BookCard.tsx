import Image from "next/image";
import Link from "next/link";
import { memo, useMemo, useCallback } from "react";

import type { Book } from "@/modules/catalog/types/book";
import { useBookLoans } from "@/modules/catalog/hooks/useBookLoans";
import { toast } from "react-hot-toast";

import styles from "./BookCard.module.css";

export type BookCardProps = {
  book: Book & {
    internalStatus?: "available" | "borrowed";
    isBorrowedByCurrentUser?: boolean;
    isBorrowable?: boolean;
  };
};

const STATUS_STYLES: Record<string, string> = {
  available: styles.statusAvailable,
  borrowed: styles.statusBorrowed,
  borrowedByUser: styles.statusBorrowedByUser,
  unavailable: styles.statusUnavailable,
};

// Separate status computation to avoid re-computation
function getStatusClasses(status: string, isBorrowedByCurrentUser?: boolean) {
  const displayStatus = isBorrowedByCurrentUser ? "borrowedByUser" : status;
  return `${styles.statusChip} ${STATUS_STYLES[displayStatus]}`;
}

export default memo(function BookCard({ book }: BookCardProps) {
  const status = book.internalStatus ?? book.status ?? "available";
  const isBorrowedByCurrentUser = book.internalStatus === "borrowed" && book.isBorrowedByCurrentUser;
  const { returnBook, userLoans, isLoading } = useBookLoans();

  const activeLoan = useMemo(
    () =>
      userLoans.find(
        (loan) => loan.bookId === book.id && !loan.returnedAt,
      ) ?? null,
    [userLoans, book.id],
  );

  const showReturnButton = isBorrowedByCurrentUser && !!activeLoan;

  const handleReturn = useCallback(async () => {
    if (showReturnButton && book.id) {
      if (!activeLoan) {
        toast.error("Unable to locate active loan");
        return;
      }

      await returnBook(activeLoan.id);
    }
  }, [showReturnButton, book.id, activeLoan, returnBook]);

  return (
    <article className={styles.card}>
      <div className={styles.glowOverlay} />
      <Link
        href={`/book/${book.id}`}
        className={styles.coverLink}
      >
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className={styles.coverImage}
            priority={false}
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            No Cover
          </div>
        )}
        <span
          className={getStatusClasses(status, isBorrowedByCurrentUser)}
        >
          {isBorrowedByCurrentUser ? "Your Book" : status}
        </span>
      </Link>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {book.title}
          </h3>
          <p className={styles.author}>{book.author}</p>
        </div>
        <div className={styles.metaBlock}>
          <div className={styles.meta}>
            <span>{book.year ? `Published ${book.year}` : "Year Unknown"}</span>
            <span>{book.format ?? "Digital"}</span>
          </div>
          {showReturnButton && (
            <div className={styles.returnRow}>
              <button
                onClick={handleReturn}
                className={styles.returnButton}
                disabled={isLoading}
              >
                Return
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.bottomGlow} />
    </article>
  );
});
