import type { Book } from "@/modules/catalog/types/book";
import { useBookLoansStore } from "@/modules/catalog/store/useBookLoansStore";
import { useWishlistStore } from "@/modules/catalog/store/useWishlistStore";

export interface EnrichedBook extends Book {
  internalStatus?: "available" | "borrowed";
  isBorrowedByCurrentUser?: boolean;
  isBorrowable?: boolean;
  isInWishlist?: boolean;
}

/**
 * Enhances books with internal loan status information
 */
export function enrichBooksWithLoanStatus(books: Book[], userId: string | null): EnrichedBook[] {
  const getBookAvailability = useBookLoansStore.getState().getBookAvailability;
  const isBookBorrowedByUser = useBookLoansStore.getState().isBookBorrowedByUser;
  const isBookInWishlist = useWishlistStore.getState().isBookInWishlist;

  return books.map(book => {
    const internalStatus = getBookAvailability(book.id);
    const isBorrowedByCurrentUser = userId ? isBookBorrowedByUser(book.id, userId) : false;
    const isBorrowable = internalStatus === "available" && !!userId;
    const bookIsInWishlist = isBookInWishlist(book.id);

    return {
      ...book,
      internalStatus,
      isBorrowedByCurrentUser,
      isBorrowable,
      isInWishlist: bookIsInWishlist,
    };
  });
}

/**
 * Updates book status in an array based on current internal state
 */
export function updateBookStatuses(books: Book[]): EnrichedBook[] {
  const getBookAvailability = useBookLoansStore.getState().getBookAvailability;

  return books.map(book => ({
    ...book,
    internalStatus: getBookAvailability(book.id),
  }));
}

/**
 * Formats loan history for display
 */
export function formatLoanHistory(loanDate: string, dueDate?: string, returnedDate?: string): {
  status: "active" | "overdue" | "returned";
  daysUntilDue: number;
  loanDate: string;
  dueDate?: string;
  returnedDate?: string;
} {
  const now = new Date();
  const loan = new Date(loanDate);
  const due = dueDate ? new Date(dueDate) : new Date(loan.getTime() + 14 * 24 * 60 * 60 * 1000);
  const returned = returnedDate ? new Date(returnedDate) : null;

  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let status: "active" | "overdue" | "returned" = "active";

  if (returned) {
    status = "returned";
  } else if (daysUntilDue < 0) {
    status = "overdue";
  }

  return {
    status,
    daysUntilDue,
    loanDate: loan.toLocaleDateString(),
    dueDate: due.toLocaleDateString(),
    returnedDate: returned?.toLocaleDateString(),
  };
}
