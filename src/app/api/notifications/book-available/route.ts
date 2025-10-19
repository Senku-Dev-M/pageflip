import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "@/config/firebase";

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

type WishlistRecord = {
  bookId: string;
  title: string;
  author?: string | null;
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
};

type NotifyPayload = {
  bookId?: unknown;
  bookTitle?: unknown;
  bookAuthor?: unknown;
  excludeUserId?: unknown;
};

function parsePayload(body: NotifyPayload) {
  if (typeof body.bookId !== "string" || body.bookId.trim().length === 0) {
    throw new Error("INVALID_BOOK_ID");
  }

  const parsed = {
    bookId: body.bookId.trim(),
    bookTitle: typeof body.bookTitle === "string" ? body.bookTitle.trim() : null,
    bookAuthor: typeof body.bookAuthor === "string" ? body.bookAuthor.trim() : null,
    excludeUserId:
      typeof body.excludeUserId === "string" && body.excludeUserId.trim().length > 0
        ? body.excludeUserId.trim()
        : null,
  };

  return parsed;
}

function extractWishlistRecord(docSnapshot: QueryDocumentSnapshot): WishlistRecord | null {
  const data = docSnapshot.data() as Partial<WishlistRecord>;

  if (!data) {
    return null;
  }

  return {
    bookId: data.bookId ?? "",
    title: data.title ?? "",
    author: data.author ?? null,
    userId: data.userId ?? "",
    userEmail: data.userEmail ?? undefined,
    userDisplayName: data.userDisplayName ?? undefined,
  };
}

export async function POST(request: Request) {
  if (!process.env.SENDGRID_API_KEY) {
    return NextResponse.json(
      { error: "SENDGRID_API_KEY_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    return NextResponse.json(
      { error: "SENDGRID_FROM_EMAIL_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  let payload: NotifyPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON_BODY" }, { status: 400 });
  }

  let parsedPayload;
  try {
    parsedPayload = parsePayload(payload);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN_VALIDATION_ERROR";
    return NextResponse.json({ error: code }, { status: 400 });
  }

  const { bookId, bookTitle, bookAuthor, excludeUserId } = parsedPayload;

  try {
    const wishlistQuery = query(
      collection(db, "wishlists"),
      where("bookId", "==", bookId),
    );

    const snapshot = await getDocs(wishlistQuery);

    if (snapshot.empty) {
      return NextResponse.json({ notified: 0 }, { status: 200 });
    }

    const recipients = new Map<
      string,
      { email: string; name?: string; userId?: string }
    >();

    snapshot.docs.forEach((docSnapshot) => {
      const record = extractWishlistRecord(docSnapshot);

      if (!record?.userEmail) {
        return;
      }

      if (excludeUserId && record.userId === excludeUserId) {
        return;
      }

      recipients.set(record.userEmail, {
        email: record.userEmail,
        name: record.userDisplayName,
        userId: record.userId,
      });
    });

    if (recipients.size === 0) {
      return NextResponse.json({ notified: 0 }, { status: 200 });
    }

    const subject =
      bookTitle && bookTitle.length > 0
        ? `“${bookTitle}” is available again`
        : "A book from your wishlist is available";
    const textBodyLines = [
      bookTitle
        ? `The book "${bookTitle}"${
            bookAuthor ? ` by ${bookAuthor}` : ""
          } is now available again on PageFlip.`
        : "A book you saved in your wishlist is now available on PageFlip.",
      "Visit the app to borrow it before someone else picks it up.",
    ];
    const textBody = textBodyLines.join("\n\n");

    const personalizations = Array.from(recipients.values()).map((recipient) => ({
      to: [
        recipient.name
          ? { email: recipient.email, name: recipient.name }
          : { email: recipient.email },
      ],
      subject,
    }));

    const sendGridResponse = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME ?? "PageFlip",
        },
        content: [
          {
            type: "text/plain",
            value: textBody,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid request failed", {
        status: sendGridResponse.status,
        body: errorText,
      });
      return NextResponse.json(
        { error: "SENDGRID_REQUEST_FAILED" },
        { status: 502 },
      );
    }

    return NextResponse.json({ notified: recipients.size }, { status: 200 });
  } catch (error) {
    console.error("Failed to notify wishlist users:", error);
    return NextResponse.json({ error: "NOTIFICATION_FAILED" }, { status: 500 });
  }
}
