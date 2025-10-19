"use client";

import { useState, useMemo, memo } from "react";
import clsx from "clsx";

import styles from "./BookPage.module.css";

type DescriptionBlockProps = {
  text: string;
  maxLength?: number;
  className?: string;
};

export default memo(function DescriptionBlock({ text, maxLength = 200, className }: DescriptionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { summary, needsTruncation } = useMemo(() => {
    if (!text) {
      return { summary: "", needsTruncation: false };
    }

    if (text.length <= maxLength) {
      return { summary: text, needsTruncation: false };
    }

    return {
      summary: text.slice(0, maxLength).trimEnd(),
      needsTruncation: true,
    };
  }, [text, maxLength]);

  const content = isExpanded || !needsTruncation ? text : `${summary}…`;

  return (
    <div className={clsx(styles.descriptionBlock, className)}>
      <p className={styles.descriptionText}>
        {content}
      </p>
      {needsTruncation ? (
        <button
          type="button"
          className={styles.descriptionLink}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      ) : null}
    </div>
  );
});
