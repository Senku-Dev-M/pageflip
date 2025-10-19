"use client";

import { useEffect, useMemo, useRef, useState, useCallback, useDeferredValue, lazy, Suspense } from "react";

import { useBookStore } from "@/modules/catalog/store/useBookStore";
import type { Book } from "@/modules/catalog/types/book";
import { fetchBooks } from "@/modules/catalog/api/booksApi";
import { enrichBooksWithLoanStatus } from "@/modules/catalog/utils/bookLoans";
import { useUserStore } from "@/modules/auth/store/useUserStore";

import styles from "./CatalogClient.module.css";

export type CatalogClientProps = {
  initialBooks: Book[];
};

const CatalogFilters = lazy(() => import("../CatalogFilters"));
const BookGrid = lazy(() => import("../BookGrid"));

export default function CatalogClient({ initialBooks }: CatalogClientProps) {
  const books = useBookStore((state) => state.books);
  const filters = useBookStore((state) => state.filters);
  const pagination = useBookStore((state) => state.pagination);
  const isLoading = useBookStore((state) => state.isLoading);
  const setBooks = useBookStore((state) => state.setBooks);
  const setPage = useBookStore((state) => state.setPage);
  const setIsLoading = useBookStore((state) => state.setIsLoading);

  const user = useUserStore((state) => state.user);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const deferredSearch = useDeferredValue(filters.search);
  const hasInitializedSearch = useRef(false);

  // Memoize handlers and functions
  const handleSetBooks = useCallback((newBooks: Book[]) => {
    setBooks(newBooks);
  }, [setBooks]);

  const handleSetPage = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  const handleSetIsLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, [setIsLoading]);

  useEffect(() => {
    handleSetBooks(initialBooks);
  }, [initialBooks, handleSetBooks]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);

    return () => window.clearTimeout(handle);
  }, [filters.search]);

  useEffect(() => {
    if (!hasInitializedSearch.current) {
      hasInitializedSearch.current = true;
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const searchQuery = debouncedSearch.trim() || undefined;

    const loadBooks = async () => {
      handleSetIsLoading(true);

      try {
        const fetchedBooks = await fetchBooks({
          query: searchQuery,
          signal: controller.signal,
        });

        if (isActive) {
          handleSetBooks(fetchedBooks);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch books", error);
      } finally {
        if (isActive) {
          handleSetIsLoading(false);
        }
      }
    };

    void loadBooks();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedSearch, handleSetBooks, handleSetIsLoading]);

  const filteredBooks = useMemo(() => {
    const searchTerm = deferredSearch.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !searchTerm ||
        [book.title, book.author]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm));

      const bookCategory = book.category ?? "Fiction";
      const matchesCategory =
        filters.category === "All" || bookCategory === filters.category;

      return matchesSearch && matchesCategory;
    });
  }, [books, filters.category, deferredSearch]);

  const sortedBooks = useMemo(() => {
    const sorted = [...filteredBooks];

    switch (filters.sort) {
      case "author": {
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      }
      case "popularity": {
        sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        break;
      }
      case "publicationDate":
      default: {
        sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      }
    }

    return sorted;
  }, [filteredBooks, filters.sort]);

  // Enrich books with loan status
  const enrichedBooks = useMemo(() => {
    return enrichBooksWithLoanStatus(sortedBooks, user?.id || null);
  }, [sortedBooks, user?.id]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedBooks.length / pagination.pageSize),
  );

  useEffect(() => {
    if (pagination.currentPage > totalPages) {
      handleSetPage(totalPages);
    }
  }, [pagination.currentPage, totalPages, handleSetPage]);

  const currentPage = Math.min(pagination.currentPage, totalPages);
  const paginatedBooks = useMemo(() => {
    const sliceStart = (currentPage - 1) * pagination.pageSize;
    return enrichedBooks.slice(sliceStart, sliceStart + pagination.pageSize);
  }, [enrichedBooks, currentPage, pagination.pageSize]);
  const startIndex = (currentPage - 1) * pagination.pageSize;

  const showingFrom = sortedBooks.length ? startIndex + 1 : 0;
  const showingTo = Math.min(
    sortedBooks.length,
    startIndex + pagination.pageSize,
  );

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    handleSetPage(page);
  }, [totalPages, handleSetPage]);

  // Generate limited pagination buttons to prevent overflow
  const paginationButtons = useMemo(() => {
    const buttons = [];

    // Always show Prev button
    buttons.push(
      <button
        key="prev"
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        className={`${styles.navButton} ${currentPage === 1 ? styles.disabled : ""}`}
        disabled={currentPage === 1}
      >
        Prev
      </button>
    );

    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        buttons.push(
          <button
            key={i}
            type="button"
            onClick={() => handlePageChange(i)}
            className={`${styles.pageButton} ${isActive ? styles.pageButtonActive : ""}`}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show limited range with ellipsis
      const leftBound = Math.max(1, currentPage - 2);
      const rightBound = Math.min(totalPages, currentPage + 2);

      // Always show first page
      if (leftBound > 1) {
        buttons.push(
          <button
            key={1}
            type="button"
            onClick={() => handlePageChange(1)}
            className={styles.pageButton}
          >
            1
          </button>
        );
        if (leftBound > 2) {
          buttons.push(
            <span key="ellipsis-left" className={styles.ellipsis}>
              ...
            </span>
          );
        }
      }

      // Show current page range
      for (let i = leftBound; i <= rightBound; i++) {
        const isActive = i === currentPage;
        buttons.push(
          <button
            key={i}
            type="button"
            onClick={() => handlePageChange(i)}
            className={`${styles.pageButton} ${isActive ? styles.pageButtonActive : ""}`}
          >
            {i}
          </button>
        );
      }

      // Always show last page
      if (rightBound < totalPages) {
        if (rightBound < totalPages - 1) {
          buttons.push(
            <span key="ellipsis-right" className={styles.ellipsis}>
              ...
            </span>
          );
        }
        buttons.push(
          <button
            key={totalPages}
            type="button"
            onClick={() => handlePageChange(totalPages)}
            className={styles.pageButton}
          >
            {totalPages}
          </button>
        );
      }
    }

    // Always show Next button
    buttons.push(
      <button
        key="next"
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        className={`${styles.navButton} ${currentPage === totalPages ? styles.disabled : ""}`}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    );

    return buttons;
  }, [currentPage, totalPages, handlePageChange]);

  return (
    <div className={styles.container}>
      <Suspense fallback={<div className={styles.loading}>Preparing filters...</div>}>
        <CatalogFilters />
      </Suspense>
      {isLoading && (
        <div className={styles.loading}>
          Scanning the grid for fresh transmissions...
        </div>
      )}
      <Suspense fallback={<div className={styles.loading}>Preparing catalog grid...</div>}>
        <BookGrid
          books={paginatedBooks}
          emptyState={<p>No transmissions detected. Try adjusting your filters.</p>}
        />
      </Suspense>
      <div className={styles.paginationCard}>
        <span className={styles.pageInfo}>
          {sortedBooks.length
            ? `Showing ${showingFrom}-${showingTo} of ${sortedBooks.length} results`
            : "No results found"}
        </span>
        <div className={styles.pagination}>
          {paginationButtons}
        </div>
      </div>
    </div>
  );
}
