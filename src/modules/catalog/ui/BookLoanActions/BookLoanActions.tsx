"use client";

import { useMemo } from "react";

import type { Book } from "@/modules/catalog/types/book";
import { useBookLoans } from "@/modules/catalog/hooks/useBookLoans";
import { useBookLoansStore } from "@/modules/catalog/store/useBookLoansStore";
import { useUserStore } from "@/modules/auth/store/useUserStore";
import { useWishlist } from "@/modules/catalog/hooks/useWishlist";

import styles from "./BookLoanActions.module.css";

export type BookLoanActionsProps = {
  book: Book;
  remoteStatus: "available" | "borrowed";
};

export default function BookLoanActions({ book, remoteStatus }: BookLoanActionsProps) {
  const user = useUserStore((state) => state.user);
  const userId = user?.id ?? null;
  const { borrowBook, returnBook, isLoading } = useBookLoans();
  const { addToWishlist, removeFromWishlist, isBookInWishlist } = useWishlist();

  const loans = useBookLoansStore((state) => state.loans);
  const activeLoan = useMemo(
    () =>
      loans.find(
        (loan) => loan.bookId === book.id && !loan.returnedAt,
      ) ?? null,
    [loans, book.id],
  );
  const isBorrowed = Boolean(activeLoan);
  const isBorrowedByUser = Boolean(activeLoan && userId && activeLoan.borrowedBy === userId);
  const bookIsInWishlist = isBookInWishlist(book.id);

  const canBorrow = !isBorrowed && remoteStatus === "available";

  const actionLabel = useMemo(() => {
    if (isBorrowedByUser) {
      return "Return Book";
    }
    if (!canBorrow) {
      return remoteStatus === "borrowed" ? "Request Hold" : "Loan Unavailable";
    }
    return "Acquire Loan";
  }, [canBorrow, isBorrowedByUser, remoteStatus]);

  const actionDisabled = isLoading || (!isBorrowedByUser && (!canBorrow || !user));

  const toneClass = isBorrowedByUser
    ? styles.return
    : canBorrow
      ? styles.borrow
      : styles.unavailable;
  const buttonClasses = [styles.button, toneClass];
  if (actionDisabled) {
    buttonClasses.push(styles.disabled);
  }

  const handleBorrow = async () => {
    await borrowBook(book);
  };

  const handleReturn = async () => {
    if (!activeLoan) {
      return;
    }
    await returnBook(activeLoan.id);
  };

  const handleWishlistToggle = async () => {
    if (bookIsInWishlist) {
      await removeFromWishlist(book.id);
    } else {
      await addToWishlist(book);
    }
  };

  const onClick = isBorrowedByUser ? handleReturn : canBorrow ? handleBorrow : undefined;
  const wishlistButtonClasses = [styles.button, bookIsInWishlist ? styles.wishlistActive : styles.wishlist];

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={buttonClasses.join(" ")}
        onClick={onClick}
        disabled={actionDisabled}
      >
        <span className={styles.content}>
          {isLoading ? (
            <span className={styles.spinner} />
          ) : null}
          <span>{actionLabel}</span>
        </span>
      </button>
      <button
        type="button"
        className={wishlistButtonClasses.join(" ")}
        onClick={handleWishlistToggle}
        disabled={!user}
      >
        <span className={styles.content}>
          <span>
            {bookIsInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </span>
        </span>
      </button>
    </div>
  );
}
