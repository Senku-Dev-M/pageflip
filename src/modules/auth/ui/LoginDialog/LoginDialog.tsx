"use client";

import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { auth } from "@/config/firebase";

import styles from "./LoginDialog.module.css";

export type LoginDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
};

export default function LoginDialog({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setError(null);
    setStatus(null);
    setEmail("");
    setPassword("");
    setIsSubmitting(false);
  };

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose]);

  const handleSwitchToRegister = () => {
    resetState();
    onSwitchToRegister();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("Connection established. Welcome back, operator.");
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? err.message
          : "Unable to authenticate. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (status) {
      // Auto-close modal after successful login
      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [status, handleClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close login dialog"
          className={styles.closeButton}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={styles.closeIcon}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className={styles.content}>
          <header className={styles.header}>
            <p className={styles.kicker}>
              Authentication
            </p>
            <h2 className={styles.title}>
              Secure Access Terminal
            </h2>
            <p className={styles.description}>
              Route your credentials through the encrypted uplink to rejoin the PageFlip grid.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label
                htmlFor="login-email"
                className={styles.label}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label
                htmlFor="login-password"
                className={styles.label}
              >
                Access Key
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.input}
              />
            </div>

            {error ? (
              <p className={styles.alert}>
                {error}
              </p>
            ) : null}

            {status ? (
              <p className={styles.status}>
                {status}
              </p>
            ) : null}

            <button
              type="submit"
              className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ""}`}
              disabled={isSubmitting}
            >
              <span className={styles.submitContent}>
                {isSubmitting ? <span className={styles.spinner} /> : null}
                <span>{isSubmitting ? "Linking" : "Connect"}</span>
              </span>
            </button>
          </form>
          <div className={styles.footer}>
            <p>
              Need to register?
              {" "}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className={styles.footerButton}
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
