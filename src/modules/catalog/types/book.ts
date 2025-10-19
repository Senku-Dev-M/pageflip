export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  description?: string;
  year?: number;
  format?: string;
  tags?: string[];
  status?: "available" | "borrowed";
  category?: "Fiction" | "Science" | "History";
  popularity?: number;
}
