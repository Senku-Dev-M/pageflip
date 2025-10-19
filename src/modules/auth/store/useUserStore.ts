"use client";

import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
};

type UserState = {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
};

const initialState = {
  user: null,
  isLoading: true,
};

const createUserStore: StateCreator<UserState, [["zustand/devtools", never]]> = (set) => ({
  ...initialState,
  setUser: (user) =>
    set(
      { user },
      false,
      "user/setUser",
    ),
  setIsLoading: (isLoading) =>
    set(
      { isLoading },
      false,
      "user/setIsLoading",
    ),
  reset: () =>
    set(
      initialState,
      false,
      "user/reset",
    ),
});

export const useUserStore = create<UserState>()(
  devtools(createUserStore, {
    name: "UserStore",
    enabled: process.env.NODE_ENV !== "production",
    trace: true,
    traceLimit: 25,
  }),
);

export type { SessionUser };
