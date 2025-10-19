"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { addBookToWishlist, removeBookFromWishlist, subscribeToUserWishlist } from "@/modules/catalog/api/wishlist";
import { useWishlistStore } from "@/modules/catalog/store/useWishlistStore";
import type { Book } from "@/modules/catalog/types/book";
import { useUserStore } from "@/modules/auth/store/useUserStore";
import type { WishlistItem } from "@/modules/catalog/store/useWishlistStore";

interface UseWishlistReturn {
  addToWishlist: (book: Book) => Promise<boolean>;
  removeFromWishlist: (bookId: string) => Promise<boolean>;
  isLoading: boolean;
  isBookInWishlist: (bookId: string) => boolean;
  userWishlist: WishlistItem[];
}

const userWishlistSubscriptions = new Map<string, { count: number; unsubscribe: () => void }>();

function retainUserWishlist(
  userId: string,
  setWishlistItems: (items: WishlistItem[]) => void,
): () => void {
  const current = userWishlistSubscriptions.get(userId);

  if (current) {
    current.count += 1;
    return () => releaseUserWishlist(userId);
  }

  const unsubscribe = subscribeToUserWishlist(userId, setWishlistItems);
  userWishlistSubscriptions.set(userId, { count: 1, unsubscribe });

  return () => releaseUserWishlist(userId);
}

function releaseUserWishlist(userId: string): void {
  const current = userWishlistSubscriptions.get(userId);

  if (!current) {
    return;
  }

  const nextCount = current.count - 1;

  if (nextCount <= 0) {
    current.unsubscribe();
    userWishlistSubscriptions.delete(userId);
    return;
  }

  current.count = nextCount;
}

export function useWishlist(): UseWishlistReturn {
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const userId = user?.id ?? null;
  const setWishlistItems = useWishlistStore((state) => state.setWishlistItems);
  const isBookInWishlist = useWishlistStore((state) => state.isBookInWishlist);
  const userWishlistState = useWishlistStore((state) => state.wishlistItems);

  useEffect(() => {
    if (!userId) {
      setWishlistItems([]);
      return;
    }

    const release = retainUserWishlist(userId, setWishlistItems);

    return () => {
      release();
    };
  }, [setWishlistItems, userId]);

  const handleAddToWishlist = useCallback(async (book: Book): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in to add books to your wishlist");
      return false;
    }

    if (isBookInWishlist(book.id)) {
      toast.error(`"${book.title}" is already in your wishlist`);
      return false;
    }

    setIsLoading(true);

    try {
      await addBookToWishlist(book, user);
      toast.success(`"${book.title}" added to your wishlist!`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "BOOK_ALREADY_IN_WISHLIST") {
        toast.error(`"${book.title}" is already in your wishlist`);
      } else {
        console.error("Failed to add book to wishlist:", error);
        toast.error("Failed to add book to wishlist. Please try again.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isBookInWishlist]);

  const handleRemoveFromWishlist = useCallback(async (bookId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please log in to manage your wishlist");
      return false;
    }

    setIsLoading(true);

    try {
      await removeBookFromWishlist(bookId, user.id);
      toast.success("Book removed from wishlist");
      return true;
    } catch (error) {
      console.error("Failed to remove book from wishlist:", error);
      toast.error("Failed to remove book from wishlist. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    addToWishlist: handleAddToWishlist,
    removeFromWishlist: handleRemoveFromWishlist,
    isLoading,
    isBookInWishlist,
    userWishlist: userWishlistState,
  };
}
