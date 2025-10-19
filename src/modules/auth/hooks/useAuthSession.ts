"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/config/firebase";
import { type SessionUser, useUserStore } from "@/modules/auth/store/useUserStore";

type UseAuthSessionReturn = {
  user: SessionUser | null;
  isLoading: boolean;
};

export function useAuthSession(): UseAuthSessionReturn {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const setIsLoading = useUserStore((state) => state.setIsLoading);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const normalizedUser: SessionUser = {
          id: firebaseUser.uid,
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Agent",
          email: firebaseUser.email ?? "",
          avatarUrl: firebaseUser.photoURL ?? undefined,
        };

        setUser(normalizedUser);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [setIsLoading, setUser]);

  return { user, isLoading };
}

