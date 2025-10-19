"use client";

import Image from "next/image";
import { useMemo } from "react";

import { useBookLoans } from "@/modules/catalog/hooks/useBookLoans";
import { formatLoanHistory } from "@/modules/catalog/utils/bookLoans";

import styles from "./ActiveLoansPage.module.css";

const FALLBACK_COLORS = ["#1dd3bf", "#14b8a6", "#ec4899", "#2b3546", "#3f4a63", "#1a202c"];

export default function ActiveLoansPage() {
  const { userLoans, returnBook, isLoading } = useBookLoans();

  const activeLoans = useMemo(() => {
    return userLoans.map((loan, index) => {
      const history = formatLoanHistory(
        loan.borrowedAt,
        loan.dueDate,
        loan.returnedAt ?? undefined,
      );

      const statusLabel =
        history.status === "overdue"
          ? `Overdue by ${Math.abs(history.daysUntilDue)} day${Math.abs(history.daysUntilDue) === 1 ? "" : "s"}`
          : `${history.daysUntilDue} day${history.daysUntilDue === 1 ? "" : "s"} left`;

      return {
        loan,
        history,
        statusLabel,
        cover: loan.cover ?? null,
        fallbackColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        initials: loan.title.slice(0, 2).toUpperCase(),
      };
    });
  }, [userLoans]);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <p className={styles.kicker}>Active Loans</p>
        <h1 className={styles.title}>
          My Active Loans
        </h1>
        <p className={styles.subtitle}>
          Data currently in your possession. Secure returns before the due window closes.
        </p>
      </header>
      <div className={styles.panel}>
        {activeLoans.length === 0 ? (
          <div className={styles.emptyState}>
            No active loans yet. Secure a title from the catalog to deploy it here.
          </div>
        ) : (
          <ul className={styles.list}>
            {activeLoans.map(({ loan, cover, fallbackColor, history, statusLabel, initials }) => (
              <li key={loan.id} className={styles.loanCard}>
                <div className={styles.loanVisual}>
                  {cover ? (
                    <Image
                      src={cover}
                      alt={`Cover of ${loan.title}`}
                      fill
                      sizes="(max-width: 768px) 40vw, 96px"
                      className={styles.loanCoverImage}
                      priority={false}
                    />
                  ) : (
                    <div
                      className={styles.loanVisualFallback}
                      style={{ backgroundColor: fallbackColor }}
                    >
                      <span>{initials}</span>
                    </div>
                  )}
                  <div className={styles.loanVisualGlow} />
                </div>
                <div className={styles.loanBody}>
                  <div className={styles.loanHeader}>
                    <div>
                      <h2 className={styles.loanTitle}>{loan.title}</h2>
                      <p className={styles.loanAuthor}>{loan.author}</p>
                    </div>
                    <span
                      className={`${styles.statusChip} ${
                        history.status === "overdue" ? styles.statusOverdue : styles.statusActive
                      }`}
                      aria-label={history.status === "overdue" ? "Loan overdue" : "Loan active"}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className={styles.loanMeta}>
                    <span>
                      <span className={styles.metaLabel}>Borrowed:</span>
                      {history.loanDate}
                    </span>
                    {history.dueDate ? (
                      <span>
                        <span className={styles.metaLabel}>Due:</span>
                        {history.dueDate}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.returnButton}
                  onClick={() => returnBook(loan.id)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Return"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
