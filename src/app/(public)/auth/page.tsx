"use client";

import { useState } from "react";

import LoginDialog from "@/modules/auth/ui/LoginDialog";
import RegisterDialog from "@/modules/auth/ui/RegisterDialog";

import styles from "./AuthPage.module.css";

export default function AuthPreviewPage() {
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  const openLogin = () => setActiveModal("login");
  const openRegister = () => setActiveModal("register");
  const closeModals = () => setActiveModal(null);

  return (
    <main className={styles.main}>
      <div className={styles.backdrop}>
        <div className={styles.glowTeal} />
        <div className={styles.glowFuchsia} />
        <div className={styles.radial} />
      </div>

      <div className={styles.hero}>
        <p className={styles.heroKicker}>PageFlip Access Grid</p>
        <h1 className={styles.heroTitle}>Authentication Modules</h1>
        <p className={styles.heroDescription}>
          Launch the neon terminals below to connect with Firebase Authentication. These dialogs showcase the cyberpunk styling
          used across the PageFlip experience.
        </p>
      </div>

      <div className={styles.panels}>
        <div className={styles.panel}>
          <p className={styles.panelKicker}>Existing Operatives</p>
          <button type="button" onClick={openLogin} className={styles.panelButton}>
            Access Node
          </button>
        </div>
        <div className={`${styles.panel} ${styles.fuchsia}`}>
          <p className={`${styles.panelKicker} ${styles.fuchsia}`}>New Recruits</p>
          <button type="button" onClick={openRegister} className={`${styles.panelButton} ${styles.fuchsia}`}>
            Initiate Signup
          </button>
        </div>
      </div>

      <LoginDialog
        isOpen={activeModal === "login"}
        onClose={closeModals}
        onSwitchToRegister={openRegister}
      />
      <RegisterDialog
        isOpen={activeModal === "register"}
        onClose={closeModals}
        onSwitchToLogin={openLogin}
      />
    </main>
  );
}
