"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { createLoan, markLoanAsReturned, subscribeToActiveLoans, subscribeToUserLoans } from "@/modules/catalog/api/loans";
import { useBookLoansStore } from "@/modules/catalog/store/useBookLoansStore";
import type { Book } from "@/modules/catalog/types/book";
import type { BookLoan } from "@/modules/catalog/store/useBookLoansStore";
import { useUserStore } from "@/modules/auth/store/useUserStore";

interface UseBookLoansReturn {
  borrowBook: (book: Book) => Promise<boolean>;
  returnBook: (loanId: string) => Promise<boolean>;
  isLoading: boolean;
  userLoans: BookLoan[];
}

let activeLoansSubscriberCount = 0;
let activeLoansUnsubscribe: (() => void) | null = null;

const userLoanSubscriptions = new Map<string, { count: number; unsubscribe: () => void }>();

function retainActiveLoans(setLoans: (loans: BookLoan[]) => void): () => void {
  activeLoansSubscriberCount += 1;

  if (!activeLoansUnsubscribe) {
    activeLoansUnsubscribe = subscribeToActiveLoans(setLoans);
  }

  return () => {
    activeLoansSubscriberCount = Math.max(activeLoansSubscriberCount - 1, 0);

    if (activeLoansSubscriberCount === 0 && activeLoansUnsubscribe) {
      activeLoansUnsubscribe();
      activeLoansUnsubscribe = null;
    }
  };
}

function retainUserLoans(
  userId: string,
  setUserLoans: (loans: BookLoan[]) => void,
): () => void {
  const current = userLoanSubscriptions.get(userId);

  if (current) {
    current.count += 1;
    return () => releaseUserLoans(userId);
  }

  const unsubscribe = subscribeToUserLoans(userId, setUserLoans);
  userLoanSubscriptions.set(userId, { count: 1, unsubscribe });

  return () => releaseUserLoans(userId);
}

function releaseUserLoans(userId: string): void {
  const current = userLoanSubscriptions.get(userId);

  if (!current) {
    return;
  }

  const nextCount = current.count - 1;

  if (nextCount <= 0) {
    current.unsubscribe();
    userLoanSubscriptions.delete(userId);
    return;
  }

  current.count = nextCount;
}

export function useBookLoans(): UseBookLoansReturn {
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const userId = user?.id ?? null;
  const setLoans = useBookLoansStore((state) => state.setLoans);
  const setUserLoans = useBookLoansStore((state) => state.setUserLoans);
  const getBookAvailability = useBookLoansStore((state) => state.getBookAvailability);
  const isBookBorrowedByUser = useBookLoansStore((state) => state.isBookBorrowedByUser);
  const userLoansState = useBookLoansStore((state) => state.userLoans);

  useEffect(() => {
    const release = retainActiveLoans(setLoans);
    return () => {
      release();
    };
  }, [setLoans]);

  useEffect(() => {
    if (!userId) {
      setUserLoans([]);
      return;
    }

    const release = retainUserLoans(userId, setUserLoans);

    return () => {
      release();
    };
  }, [setUserLoans, userId]);

  const userLoans = useMemo(() => {
    return userLoansState.filter((loan) => !loan.returnedAt);
  }, [userLoansState]);

  const handleBorrowBook = useCallback(async (book: Book): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in to borrow books");
      return false;
    }

    const availability = getBookAvailability(book.id);
    if (availability === "borrowed") {
      toast.error(`"${book.title}" is not available for borrowing`);
      return false;
    }

    if (isBookBorrowedByUser(book.id, user.id)) {
      toast.error(`You already borrowed "${book.title}"`);
      return false;
    }

    setIsLoading(true);

    try {
      await createLoan(book, user);
      toast.success(`"${book.title}" borrowed successfully!`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "BOOK_ALREADY_BORROWED") {
        toast.error(`"${book.title}" is not available for borrowing`);
      } else {
        console.error("Failed to borrow book:", error);
        toast.error("Failed to process your request. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, getBookAvailability, isBookBorrowedByUser]);

  const handleReturnBook = useCallback(async (loanId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in to return books");
      return false;
    }

    if (!loanId) {
      toast.error("Unable to locate loan to return");
      return false;
    }

    setIsLoading(true);

    try {
      await markLoanAsReturned(loanId);
      toast.success("Book returned successfully!");
      return true;
    } catch (error) {
      console.error("Failed to return book:", error);
      toast.error("Failed to process your return. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    borrowBook: handleBorrowBook,
    returnBook: handleReturnBook,
    isLoading,
    userLoans,
  };
}
