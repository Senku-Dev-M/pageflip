"use client";

import { ChangeEvent, useCallback, memo } from "react";

import { useBookStore } from "@/modules/catalog/store/useBookStore";

import styles from "./CatalogFilters.module.css";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "All" as const },
  { label: "Fiction", value: "Fiction" as const },
  { label: "Science", value: "Science" as const },
  { label: "History", value: "History" as const },
];

const SORT_OPTIONS = [
  { label: "Author", value: "author" as const },
  { label: "Popularity", value: "popularity" as const },
  { label: "Publication Date", value: "publicationDate" as const },
];

function CatalogFiltersComponent() {
  const filters = useBookStore((state) => state.filters);
  const updateFilters = useBookStore((state) => state.updateFilters);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: event.target.value });
  }, [updateFilters]);

  const handleCategoryChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ category: event.target.value as (typeof CATEGORY_OPTIONS)[number]["value"] });
  }, [updateFilters]);

  const handleSortChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: event.target.value as (typeof SORT_OPTIONS)[number]["value"] });
  }, [updateFilters]);

  return (
    <div className={styles.container}>
      <input
        className="cyber-input"
        placeholder="Search by title or author..."
        value={filters.search}
        onChange={handleSearchChange}
        type="search"
        aria-label="Search the catalog by title or author"
      />
      <div className={styles.controls}>
        <select
          className="cyber-select"
          value={filters.category}
          onChange={handleCategoryChange}
          aria-label="Filter catalog by category"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="cyber-select"
          value={filters.sort}
          onChange={handleSortChange}
          aria-label="Sort catalog"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default memo(CatalogFiltersComponent);
