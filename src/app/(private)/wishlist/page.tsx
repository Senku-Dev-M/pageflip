"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { useWishlist } from "@/modules/catalog/hooks/useWishlist";

import styles from "./WishlistPage.module.css";

const FALLBACK_COLORS = ["#1dd3bf", "#14b8a6", "#ec4899", "#2b3546", "#3f4a63", "#1a202c"];

export default function WishlistPage() {
  const { userWishlist } = useWishlist();

  const wishlistBooks = useMemo(() => {
    return userWishlist.map((item, index) => ({
      ...item,
      fallbackColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      initials: item.title.slice(0, 2).toUpperCase(),
    }));
  }, [userWishlist]);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <p className={styles.kicker}>Wishlist</p>
        <h1 className={styles.title}>
          {wishlistBooks.length === 0 ? "Dreams queued for your neural reader" : `Saved Books (${wishlistBooks.length})`}
        </h1>
        <p className={styles.subtitle}>
          Books you&apos;ve marked for later. Your future reading adventures.
        </p>
      </header>
      <div className={styles.panel}>
        {wishlistBooks.length === 0 ? (
          <div className={styles.emptyState}>
            Your wishlist is empty. Start exploring the catalog and save books for later.
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlistBooks.map((item) => (
              <article key={item.id} className={styles.bookCard}>
                <Link href={`/book/${item.bookId}`} className={styles.bookLink}>
                  <div className={styles.bookVisual}>
                    {item.cover ? (
                      <Image
                        src={item.cover}
                        alt={`Cover of ${item.title}`}
                        fill
                        sizes="(max-width: 768px) 45vw, 200px"
                        className={styles.bookCoverImage}
                        priority={false}
                      />
                    ) : (
                      <div
                        className={styles.bookVisualFallback}
                        style={{ backgroundColor: item.fallbackColor }}
                      >
                        <span>{item.initials}</span>
                      </div>
                    )}
                    <div className={styles.bookVisualGlow} />
                  </div>
                  <div className={styles.bookInfo}>
                    <h2 className={styles.bookTitle}>{item.title}</h2>
                    <p className={styles.bookAuthor}>{item.author}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
