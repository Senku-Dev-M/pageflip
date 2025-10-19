import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import BookLoanActions from "@/modules/catalog/ui/BookLoanActions";
import type { Book } from "@/modules/catalog/types/book";

import styles from "./BookPage.module.css";
import DescriptionBlock from "./DescriptionBlock";
import StarRating from "./StarRating";

const OPEN_LIBRARY_BASE = "https://openlibrary.org";

function extractDescription(
  description: string | { value?: string } | { value?: string; type?: string } | undefined,
) {
  if (!description) return undefined;
  if (typeof description === "string") return description;
  if (typeof description.value === "string") return description.value;
  return undefined;
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type OpenLibraryWork = {
  title?: string;
  description?: string | { value?: string };
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
  created?: { value?: string };
  availability?: { status?: "available" | "borrowed" | string };
  authors?: Array<{ author: { key: string } }>;
  publishers?: string[];
  number_of_pages_median?: number;
  ratings_average?: number;
  ratings_count?: number;
};

type OpenLibraryAuthor = {
  name?: string;
  personal_name?: string;
};

type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

type RecommendedWork = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
};

async function fetchWork(id: string): Promise<OpenLibraryWork | null> {
  try {
    const res = await fetch(`${OPEN_LIBRARY_BASE}/works/${id}.json`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Failed to load work ${id}:`, res.status, res.statusText);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching work ${id}:`, error);
    return null;
  }
}

async function fetchAuthorName(key: string) {
  try {
    const res = await fetch(`${OPEN_LIBRARY_BASE}${key}.json`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Failed to load author ${key}:`, res.status, res.statusText);
      return null;
    }

    const payload: OpenLibraryAuthor = await res.json();
    return payload.name ?? payload.personal_name ?? null;
  } catch (error) {
    console.error(`Error fetching author ${key}:`, error);
    return null;
  }
}

function determineStatus(work: OpenLibraryWork | null): "available" | "borrowed" {
  const status = work?.availability?.status?.toLowerCase();
  if (status === "borrowed") return "borrowed";
  if (status === "available") return "available";
  return "available";
}

async function fetchRecommendedWorks(work: OpenLibraryWork | null, currentId: string): Promise<RecommendedWork[]> {
  if (!work) {
    return [];
  }

  const primarySubject = work.subjects?.find((subject) => Boolean(subject?.trim()));
  const query = primarySubject ?? work.title ?? null;

  if (!query) {
    return [];
  }

  const encodedQuery = encodeURIComponent(query);
  const endpoint = primarySubject
    ? `${OPEN_LIBRARY_BASE}/search.json?subject=${encodedQuery}&limit=15`
    : `${OPEN_LIBRARY_BASE}/search.json?title=${encodedQuery}&limit=15`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      console.error("Failed to load related works:", res.status, res.statusText);
      return [];
    }

    const payload: OpenLibrarySearchResponse = await res.json();
    const docs = payload.docs ?? [];

    const recommendations: RecommendedWork[] = [];
    const seenIds = new Set<string>([currentId]);

    for (const doc of docs) {
      if (!doc?.key || recommendations.length >= 5) {
        break;
      }

      const workKey = doc.key.startsWith("/works/") ? doc.key : null;
      if (!workKey) {
        continue;
      }

      const candidateId = workKey.split("/").pop();
      if (!candidateId || seenIds.has(candidateId)) {
        continue;
      }

      const title = doc.title?.trim();
      if (!title) {
        continue;
      }

      const author = doc.author_name?.[0]?.trim() ?? "Unknown";
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined;

      recommendations.push({
        id: candidateId,
        title,
        author,
        coverUrl,
      });

      seenIds.add(candidateId);
    }

    return recommendations;
  } catch (error) {
    console.error("Error fetching related works:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = await fetchWork(id);
  const title = work?.title ? `${work.title} | PageFlip` : "Book Details | PageFlip";
  return {
    title,
    description:
      extractDescription(work?.description) ??
      "Dive into the neon-drenched archives of PageFlip's cyberpunk catalog.",
  };
}

type BookPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const work = await fetchWork(id);
  const status = determineStatus(work);

  const authorNames = work?.authors
    ? (
        await Promise.all(
          work.authors.map((entry) => fetchAuthorName(entry.author.key)),
        )
      ).filter((name): name is string => Boolean(name))
    : [];

  const recommendations = await fetchRecommendedWorks(work, id);

  const coverId = work?.covers?.[0];
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : null;

  const description =
    extractDescription(work?.description) ??
    "Open Library has not recorded a synopsis for this volume yet. Check back soon to explore its narrative circuitry.";

  const subjects = work?.subjects ?? [];
  const primarySubjects = subjects.slice(0, 3);
  const primaryGenre = primarySubjects[0] ?? "Fiction";
  const subjectSummary = primarySubjects.slice(1).join(" / ");

  const publishDate = formatDate(work?.first_publish_date ?? work?.created?.value);
  const statusLabel = status === "available" ? "Available" : "Borrowed";
  const statusClass =
    status === "available" ? styles.statusAvailable : styles.statusBorrowed;

  const primaryAuthor = authorNames[0] ?? "Unknown Author";
  const authorLine = authorNames.length ? authorNames.join(", ") : primaryAuthor;

  const publicationYear = (() => {
    const source = work?.first_publish_date ?? work?.created?.value;
    if (!source) {
      return undefined;
    }

    const match = source.match(/\d{4}/);
    if (!match) {
      return undefined;
    }

    const yearNumber = Number.parseInt(match[0], 10);
    return Number.isNaN(yearNumber) ? undefined : yearNumber;
  })();

  const loanReadyBook: Book = {
    id,
    title: work?.title ?? `Tome #${id}`,
    author: primaryAuthor,
    cover: coverUrl ?? undefined,
    description,
    year: publicationYear,
    format: "Digital",
    tags: subjects.length ? subjects.slice(0, 5) : undefined,
    status,
  };

  const ratingAverage =
    typeof work?.ratings_average === "number" && Number.isFinite(work.ratings_average)
      ? work.ratings_average
      : 4.8;

  const publisherName = work?.publishers?.[0] ?? "Unknown";
  const pageCount =
    typeof work?.number_of_pages_median === "number" && Number.isFinite(work.number_of_pages_median)
      ? work.number_of_pages_median
      : null;

  const metaEntries: Array<{ label: string; value: string; accentClass?: string }> = [
    { label: "Status", value: statusLabel, accentClass: statusClass },
    { label: "Publisher", value: publisherName },
    { label: "Pages", value: pageCount ? pageCount.toLocaleString() : "Unknown" },
    {
      label: "Published",
      value: publicationYear ? publicationYear.toString() : publishDate ?? "Unknown",
    },
  ];

  // Move to module level to avoid recreation
  const placeholderTitle = loanReadyBook.title.split(" ").slice(0, 3).join(" ");

  const palette = ["#1dd3bf", "#14b8a6", "#ec4899", "#2b3546", "#3f4a63", "#1a202c"];

  return (
    <section className={styles.section}>
      <Link href="/" className={styles.backLink}>
        &larr; Back to Catalog
      </Link>

      <div className={styles.block}>
        <div className={styles.detailGrid}>
          <div className={styles.coverPane}>
            <div className={styles.coverSurface}>
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={work?.title ?? "Book cover"}
                  fill
                  sizes="(max-width: 768px) 45vw, 272px"
                  className={styles.coverImage}
                />
              ) : (
                <span className={styles.coverFallback}>
                  {placeholderTitle}
                </span>
              )}
            </div>
            <div className={styles.loanUnderCover}>
              <BookLoanActions book={loanReadyBook} remoteStatus={status} />
            </div>
          </div>

          <div className={styles.detailContent}>
            <div className={styles.headline}>
              <span className={styles.category}>{primaryGenre}</span>
              <h1 className={styles.title}>{work?.title ?? `Tome #${id}`}</h1>
              <p className={styles.author}>
                by {authorLine}
              </p>
              {subjectSummary ? (
                <p className={styles.subheadline}>
                  {subjectSummary}
                </p>
              ) : null}
            </div>

            <StarRating rating={ratingAverage} />

            <DescriptionBlock text={description} />

            <div className={styles.metaRow}>
              {metaEntries.map(({ label, value, accentClass }) => (
                <div key={label} className={styles.metaBlock}>
                  <span className={styles.metaLabel}>{label}</span>
                  <span className={`${styles.metaValue} ${accentClass ?? ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.recommendations}>
          <div className={styles.recommendationsHeader}>
            <h2 className={styles.recommendationsHeading}>
              Related Terminals
            </h2>
            <p className={styles.recommendationsSubheading}>
              Operatives also uplinked into these transmissions.
            </p>
          </div>

          {recommendations.length > 0 ? (
            <ul className={styles.recommendationsList}>
              {recommendations.map((recommendation, index) => (
                <li key={recommendation.id} className={styles.recommendationItem}>
                  <Link
                    href={`/book/${recommendation.id}`}
                    className={styles.recommendationCard}
                  >
                    <div
                      className={styles.recommendationCover}
                      style={{ background: palette[index % palette.length] }}
                    >
                      {recommendation.coverUrl ? (
                        <Image
                          src={recommendation.coverUrl}
                          alt={`Cover of ${recommendation.title}`}
                          fill
                          sizes="120px"
                          className={styles.recommendationCoverImage}
                        />
                      ) : (
                        <span className={styles.recommendationCoverFallback}>
                          {recommendation.title.slice(0, 18)}
                        </span>
                      )}
                    </div>
                    <div className={styles.recommendationInfo}>
                      <h3 className={styles.recommendationTitle}>
                        {recommendation.title}
                      </h3>
                      <p className={styles.recommendationAuthor}>
                        {recommendation.author}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.recommendationEmpty}>
              No related transmissions detected at the moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
