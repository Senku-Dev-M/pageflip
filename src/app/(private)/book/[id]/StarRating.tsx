"use client";

import { memo } from "react";
import styles from "./BookPage.module.css";

type StarRatingProps = {
  rating: number;
};

export default memo(function StarRating({ rating }: StarRatingProps) {
  // Normalize rating between 3.6 and 5, default to 4.8
  const normalizedRating = rating && !isNaN(rating) ? Math.min(Math.max(rating, 3.6), 5) : 4.8;
  const ratingValue = Math.round(normalizedRating * 10) / 10;
  const filledStars = Math.min(5, Math.max(0, Math.round(normalizedRating)));

  return (
    <div className={styles.ratingRow}>
      <div className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <svg
            key={index}
            className={`${styles.starIcon} ${
              index < filledStars ? styles.starIconFilled : styles.starIconEmpty
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      <span className={styles.ratingScore}>
        {ratingValue.toFixed(1)} / 5.0
      </span>
    </div>
  );
});