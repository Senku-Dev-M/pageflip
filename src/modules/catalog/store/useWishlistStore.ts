"use client";

import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  bookId: string;
  title: string;
  author: string;
  cover?: string;
  userId: string;
  addedAt: string;
}

interface WishlistState {
  wishlistItems: WishlistItem[];
  setWishlistItems: (items: WishlistItem[]) => void;
  isBookInWishlist: (bookId: string) => boolean;
  userWishlist: WishlistItem[];
  reset: () => void;
}

const createWishlistStore: StateCreator<WishlistState, [["zustand/devtools", never]]> = (set, get) => ({
  wishlistItems: [],
  userWishlist: [],

  setWishlistItems: (items: WishlistItem[]) => {
    set({ wishlistItems: items }, false, "wishlist/setItems");
  },

  isBookInWishlist: (bookId: string) => {
    return get().wishlistItems.some((item) => item.bookId === bookId);
  },

  reset: () => set({ wishlistItems: [], userWishlist: [] }, false, "wishlist/reset"),
});

export const useWishlistStore = create<WishlistState>()(
  devtools(createWishlistStore, {
    name: "WishlistStore",
    enabled: process.env.NODE_ENV !== "production",
    trace: true,
    traceLimit: 25,
  }),
);
