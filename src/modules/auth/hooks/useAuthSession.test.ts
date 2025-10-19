import { act, renderHook, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';

import { useAuthSession } from './useAuthSession';
import { useUserStore } from '@/modules/auth/store/useUserStore';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  auth: {},
}));

describe('useAuthSession', () => {
  const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useUserStore.getState().reset();
    });
  });

  it('normalizes the authenticated user and stops loading', async () => {
    const unsubscribe = jest.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({
        uid: 'agent-007',
        displayName: 'Bond',
        email: 'bond@mi6.gov',
        photoURL: 'https://example.com/avatar.jpg',
      });

      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({
      id: 'agent-007',
      displayName: 'Bond',
      email: 'bond@mi6.gov',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('clears the user state when no session exists', async () => {
    const unsubscribe = jest.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return unsubscribe;
    });

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});
