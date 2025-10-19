"use client";

import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

export interface BookLoan {
  id: string;
  bookId: string;
  title: string;
  author: string;
  cover?: string;
  borrowedBy: string;
  borrowedByUsername: string;
  borrowedByEmail: string;
  borrowedAt: string;
  dueDate?: string;
  returnedAt?: string | null;
}

interface BookLoansState {
  loans: BookLoan[];
  userLoans: BookLoan[];
  setLoans: (loans: BookLoan[]) => void;
  setUserLoans: (loans: BookLoan[]) => void;
  getBookAvailability: (bookId: string) => "available" | "borrowed";
  getUserLoans: () => BookLoan[];
  isBookBorrowedByUser: (bookId: string, userId: string) => boolean;
  reset: () => void;
}

const createBookLoansStore: StateCreator<BookLoansState, [["zustand/devtools", never]]> = (set, get) => ({
  loans: [],
  userLoans: [],

  setLoans: (loans: BookLoan[]) => {
    set({ loans }, false, "loans/setLoans");
  },

  setUserLoans: (loans: BookLoan[]) => {
    set({ userLoans: loans }, false, "loans/setUserLoans");
  },

  getBookAvailability: (bookId: string) => {
    const activeLoan = get().loans.find(
      (loan) => loan.bookId === bookId && !loan.returnedAt,
    );

    return activeLoan ? "borrowed" : "available";
  },

  getUserLoans: () => {
    return get().userLoans.filter((loan) => !loan.returnedAt);
  },

  isBookBorrowedByUser: (bookId: string, userId: string) => {
    return get().loans.some(
      (loan) =>
        loan.bookId === bookId &&
        loan.borrowedBy === userId &&
        !loan.returnedAt,
    );
  },

  reset: () => set({ loans: [], userLoans: [] }, false, "loans/reset"),
});

export const useBookLoansStore = create<BookLoansState>()(
  devtools(createBookLoansStore, {
    name: "BookLoansStore",
    enabled: process.env.NODE_ENV !== "production",
    trace: true,
    traceLimit: 25,
  }),
);
