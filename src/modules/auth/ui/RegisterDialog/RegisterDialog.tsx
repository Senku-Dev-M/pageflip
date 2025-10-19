"use client";

import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { auth } from "@/config/firebase";

import styles from "./RegisterDialog.module.css";

export type RegisterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

export default function RegisterDialog({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setStatus(null);
    setIsSubmitting(false);
  };

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose]);

  const handleSwitchToLogin = () => {
    resetState();
    onSwitchToLogin();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (password !== confirmPassword) {
      setError("Access keys do not match. Recalibrate and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (credential.user && username.trim()) {
        await updateProfile(credential.user, { displayName: username.trim() });
      }

      setStatus("Registration successful. Credentials synced with the network.");
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? err.message
          : "Unable to register. Please verify your inputs.";
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
      // Auto-close modal after successful registration
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
          aria-label="Close register dialog"
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
            <p className={styles.kicker}>Registration</p>
            <h2 className={styles.title}>Initiate New Credentials</h2>
            <p className={styles.description}>
              Sync your profile details to begin your journey through the PageFlip archives.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="register-username" className={styles.label}>
                Codename
              </label>
              <input
                id="register-username"
                type="text"
                autoComplete="nickname"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="register-email" className={styles.label}>
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="register-password" className={styles.label}>
                Access Key
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="register-confirm-password" className={styles.label}>
                Confirm Access Key
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={styles.input}
              />
            </div>

            {error ? <p className={styles.alert}>{error}</p> : null}

            {status ? <p className={styles.status}>{status}</p> : null}

            <button
              type="submit"
              className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ""}`}
              disabled={isSubmitting}
            >
              <span className={styles.submitContent}>
                {isSubmitting ? <span className={styles.spinner} /> : null}
                <span>{isSubmitting ? "Linking" : "Register"}</span>
              </span>
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Already linked?
              {" "}
              <button type="button" onClick={handleSwitchToLogin} className={styles.footerButton}>
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
