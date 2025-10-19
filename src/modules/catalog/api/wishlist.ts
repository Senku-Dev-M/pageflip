"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import type { Book } from "@/modules/catalog/types/book";
import type { SessionUser } from "@/modules/auth/store/useUserStore";
import type { WishlistItem } from "@/modules/catalog/store/useWishlistStore";

const WISHLIST_COLLECTION = "wishlists";

type WishlistDocument = {
  bookId: string;
  title: string;
  author: string;
  cover?: string | null;
  userId: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  addedAt: Timestamp | null;
};

function normalizeWishlistItem(id: string, data: WishlistDocument): WishlistItem {
  const addedAtDate = data.addedAt?.toDate() ?? new Date();

  return {
    id,
    bookId: data.bookId,
    title: data.title,
    author: data.author,
    cover: data.cover ?? undefined,
    userId: data.userId,
    addedAt: addedAtDate.toISOString(),
  };
}

export async function addBookToWishlist(book: Book, user: SessionUser): Promise<void> {
  // Check if already in wishlist
  const existingQuery = query(
    collection(db, WISHLIST_COLLECTION),
    where("userId", "==", user.id),
    where("bookId", "==", book.id),
  );
  const existingDocs = await getDocs(existingQuery);

  if (!existingDocs.empty) {
    throw new Error("BOOK_ALREADY_IN_WISHLIST");
  }

  await addDoc(collection(db, WISHLIST_COLLECTION), {
    bookId: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover ?? null,
    userId: user.id,
    userEmail: user.email,
    userDisplayName: user.displayName ?? null,
    addedAt: serverTimestamp(),
  });
}

export async function removeBookFromWishlist(bookId: string, userId: string): Promise<void> {
  const wishlistQuery = query(
    collection(db, WISHLIST_COLLECTION),
    where("userId", "==", userId),
    where("bookId", "==", bookId),
  );

  const wishlistDocs = await getDocs(wishlistQuery);
  const deletePromises = wishlistDocs.docs.map((docSnapshot) =>
    deleteDoc(doc(db, WISHLIST_COLLECTION, docSnapshot.id))
  );

  await Promise.all(deletePromises);
}

export function subscribeToUserWishlist(
  userId: string,
  onUpdate: (wishlistItems: WishlistItem[]) => void,
): () => void {
  const userWishlistQuery = query(
    collection(db, WISHLIST_COLLECTION),
    where("userId", "==", userId),
  );

  return onSnapshot(
    userWishlistQuery,
    (snapshot) => {
      const wishlistItems = snapshot.docs.map((docSnapshot) =>
        normalizeWishlistItem(docSnapshot.id, docSnapshot.data() as WishlistDocument),
      );
      onUpdate(wishlistItems);
    },
    (error) => {
      console.error("User wishlist subscription error:", error);
    },
  );
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  const userWishlistQuery = query(
    collection(db, WISHLIST_COLLECTION),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(userWishlistQuery);
  return snapshot.docs.map((docSnapshot) =>
    normalizeWishlistItem(docSnapshot.id, docSnapshot.data() as WishlistDocument),
  );
}
