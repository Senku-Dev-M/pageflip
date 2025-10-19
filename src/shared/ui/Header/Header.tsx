"use client";

import Link from "next/link";
import { useState } from "react";

import { logout } from "@/modules/auth/api/auth";
import { useAuthSession } from "@/modules/auth/hooks/useAuthSession";
import LoginDialog from "@/modules/auth/ui/LoginDialog";
import RegisterDialog from "@/modules/auth/ui/RegisterDialog";

import styles from "./Header.module.css";

const navLinks = [
  { href: "/", label: "Catalog", requiresAuth: false },
  { href: "/loans", label: "My Loans", requiresAuth: true },
  { href: "/wishlist", label: "Wishlist", requiresAuth: true },
  { href: "/history", label: "History", requiresAuth: true },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { user, isLoading } = useAuthSession();
  const isLoggedIn = Boolean(user);
  const username = user?.displayName || user?.email || "Agent";

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeDialogs = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const filteredLinks = navLinks.filter(
    (link) => !link.requiresAuth || isLoggedIn,
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={styles.logoSvg}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.75 5.75h8.5a3 3 0 0 1 3 3v9.5l-3.25-2.167L9.75 18.25l-3.25-2.167L3.25 18.25v-9.5a3 3 0 0 1 3-3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.75 5.75H19a1.75 1.75 0 0 1 1.75 1.75v10.75l-2.5-1.667-1.5 1"
                />
              </svg>
            </span>
            <span className={styles.brandName}>
              PageFlip
            </span>
          </Link>
          <nav className={styles.nav}>
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.navLink}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={styles.userArea}>
            {isLoggedIn ? (
              <>
                <span className={styles.username}>{username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={styles.logoutButton}
                  aria-label="Log out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={styles.icon}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 8.25V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25v-3"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9l3 3-3 3m6-3H9"
                    />
                  </svg>
                </button>
              </>
            ) : isLoading ? (
              <span className={styles.username}>Connecting...</span>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className={styles.loginButton}
              >
                Log In
              </button>
            )}
          </div>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={styles.menuIcon}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {isMenuOpen ? (
          <div
            id="mobile-nav"
            className={styles.mobileNav}
          >
            <div className={styles.mobileLinks}>
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className={styles.mobileDivider} />
            {isLoggedIn ? (
              <div className={styles.mobileProfile}>
                <div className={styles.mobileProfileInfo}>
                  <div className={styles.mobileProfileMeta}>
                    <span className={styles.mobileProfileLabel}>Logged in as</span>
                    <span className={styles.mobileProfileName}>{username}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={styles.logoutButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={styles.icon}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 8.25V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25v-3"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9l3 3-3 3m6-3H9"
                    />
                  </svg>
                </button>
              </div>
            ) : isLoading ? (
              <span className={styles.mobileInitializing}>
                Initializing...
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openLogin();
                }}
                className={styles.mobileLoginButton}
              >
                Log In
              </button>
            )}
          </div>
        ) : null}
      </header>
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={closeDialogs}
        onSwitchToRegister={openRegister}
      />
      <RegisterDialog
        isOpen={isRegisterOpen}
        onClose={closeDialogs}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}
