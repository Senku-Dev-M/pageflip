"use client";

import { useEffect, useMemo } from "react";

import { subscribeToUserLoans } from "@/modules/catalog/api/loans";
import { useBookLoansStore } from "@/modules/catalog/store/useBookLoansStore";
import type { BookLoan } from "@/modules/catalog/store/useBookLoansStore";
import { useUserStore } from "@/modules/auth/store/useUserStore";

interface UseBookHistoryReturn {
  userReturnedBooks: BookLoan[];
  isLoading: boolean;
}

const userLoanSubscriptions = new Map<string, { count: number; unsubscribe: () => void }>();

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

export function useBookHistory(): UseBookHistoryReturn {
  const user = useUserStore((state) => state.user);
  const userId = user?.id ?? null;
  const setUserLoans = useBookLoansStore((state) => state.setUserLoans);
  const userLoansState = useBookLoansStore((state) => state.userLoans);

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

  const userReturnedBooks = useMemo(() => {
    return userLoansState
      .filter((loan) => loan.returnedAt !== null)
      .sort((a, b) =>
        new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime()
      );
  }, [userLoansState]);

  return {
    userReturnedBooks,
    isLoading: false, // Since we're using Firestore real-time updates, no loading state needed
  };
}
