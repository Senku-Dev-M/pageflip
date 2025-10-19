import { enrichBooksWithLoanStatus, formatLoanHistory, updateBookStatuses } from './bookLoans';
import { useBookLoansStore } from '@/modules/catalog/store/useBookLoansStore';
import { useWishlistStore } from '@/modules/catalog/store/useWishlistStore';

describe('bookLoans utils', () => {
  beforeEach(() => {
    useBookLoansStore.getState().reset();
    useWishlistStore.getState().reset();
  });

  afterEach(() => {
    jest.useRealTimers();
    useBookLoansStore.getState().reset();
    useWishlistStore.getState().reset();
  });

  it('enriches books with loan and wishlist information', () => {
    useBookLoansStore.setState({
      loans: [
        {
          id: 'loan-1',
          bookId: 'book-1',
          title: 'Borrowed Book',
          author: 'Author 1',
          borrowedBy: 'user-1',
          borrowedByUsername: 'Agent 1',
          borrowedByEmail: 'agent1@pageflip.io',
          borrowedAt: '2025-01-01T00:00:00Z',
          returnedAt: null,
        },
      ],
    });

    useWishlistStore.setState({
      wishlistItems: [
        {
          id: 'wish-1',
          bookId: 'book-2',
          title: 'Available Book',
          author: 'Author 2',
          userId: 'user-1',
          addedAt: '2025-01-02T00:00:00Z',
        },
      ],
    });

    const books = [
      { id: 'book-1', title: 'Borrowed Book', author: 'Author 1' },
      { id: 'book-2', title: 'Available Book', author: 'Author 2' },
    ];

    const result = enrichBooksWithLoanStatus(books, 'user-1');

    const borrowed = result.find((book) => book.id === 'book-1');
    const available = result.find((book) => book.id === 'book-2');

    expect(borrowed).toMatchObject({
      internalStatus: 'borrowed',
      isBorrowedByCurrentUser: true,
      isBorrowable: false,
      isInWishlist: false,
    });

    expect(available).toMatchObject({
      internalStatus: 'available',
      isBorrowedByCurrentUser: false,
      isBorrowable: true,
      isInWishlist: true,
    });
  });

  it('updates book statuses using current loan data', () => {
    useBookLoansStore.setState({
      loans: [
        {
          id: 'loan-1',
          bookId: 'book-2',
          title: 'Borrowed Book',
          author: 'Author 2',
          borrowedBy: 'user-2',
          borrowedByUsername: 'Agent 2',
          borrowedByEmail: 'agent2@pageflip.io',
          borrowedAt: '2025-01-01T00:00:00Z',
          returnedAt: null,
        },
      ],
    });

    const books = [
      { id: 'book-1', title: 'Available Book', author: 'Author 1' },
      { id: 'book-2', title: 'Borrowed Book', author: 'Author 2' },
    ];

    const result = updateBookStatuses(books);

    expect(result).toEqual([
      expect.objectContaining({ id: 'book-1', internalStatus: 'available' }),
      expect.objectContaining({ id: 'book-2', internalStatus: 'borrowed' }),
    ]);
  });

  it('formats loan history with default due date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-10T00:00:00Z'));

    const history = formatLoanHistory('2025-01-10T00:00:00Z');

    expect(history.status).toBe('active');
    expect(history.daysUntilDue).toBe(14);
    expect(history.loanDate).toBe(new Date('2025-01-10T00:00:00Z').toLocaleDateString());
    expect(history.dueDate).toBe(new Date('2025-01-24T00:00:00Z').toLocaleDateString());
    expect(history.returnedDate).toBeUndefined();
  });

  it('flags overdue loans when due date has passed', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-10T00:00:00Z'));

    const history = formatLoanHistory(
      '2024-12-15T00:00:00Z',
      '2025-01-05T00:00:00Z',
    );

    expect(history.status).toBe('overdue');
    expect(history.daysUntilDue).toBe(-5);
  });

  it('marks returned loans and surfaces the return date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-10T00:00:00Z'));

    const history = formatLoanHistory(
      '2025-01-01T00:00:00Z',
      '2025-01-15T00:00:00Z',
      '2025-01-08T00:00:00Z',
    );

    expect(history.status).toBe('returned');
    expect(history.returnedDate).toBe(new Date('2025-01-08T00:00:00Z').toLocaleDateString());
  });
});
