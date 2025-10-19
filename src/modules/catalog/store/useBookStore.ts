"use client";

import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import type { Book } from "@/modules/catalog/types/book";

type CatalogCategory = "All" | "Fiction" | "Science" | "History";
type SortOption = "author" | "popularity" | "publicationDate";

type BookFilters = {
  search: string;
  category: CatalogCategory;
  sort: SortOption;
};

type PaginationState = {
  currentPage: number;
  pageSize: number;
};

type BookState = {
  books: Book[];
  isLoading: boolean;
  filters: BookFilters;
  pagination: PaginationState;
  setBooks: (books: Book[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateFilters: (filters: Partial<BookFilters>) => void;
  setPage: (page: number) => void;
  reset: () => void;
};

const initialFilters: BookFilters = {
  search: "",
  category: "All",
  sort: "publicationDate",
};

const initialPagination: PaginationState = {
  currentPage: 1,
  pageSize: 14,
};

const initialState = {
  books: [] as Book[],
  isLoading: false,
  filters: initialFilters,
  pagination: initialPagination,
};

const createBookStore: StateCreator<BookState, [["zustand/devtools", never]]> = (set) => ({
  ...initialState,
  setBooks: (books) =>
    set(
      (state) => ({
        books,
        pagination: {
          ...state.pagination,
          currentPage: 1,
        },
      }),
      false,
      "book/setBooks",
    ),
  setIsLoading: (isLoading) =>
    set(
      { isLoading },
      false,
      "book/setIsLoading",
    ),
  updateFilters: (filters) =>
    set(
      (state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
        pagination: {
          ...state.pagination,
          currentPage: 1,
        },
      }),
      false,
      "book/updateFilters",
    ),
  setPage: (page) =>
    set(
      (state) => ({
        pagination: {
          ...state.pagination,
          currentPage: page,
        },
      }),
      false,
      "book/setPage",
    ),
  reset: () =>
    set(
      initialState,
      false,
      "book/reset",
    ),
});

export const useBookStore = create<BookState>()(
  devtools(createBookStore, {
    name: "BookStore",
    enabled: process.env.NODE_ENV !== "production",
    trace: true,
    traceLimit: 25,
  }),
);
