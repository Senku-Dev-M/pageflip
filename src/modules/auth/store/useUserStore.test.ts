import { act } from '@testing-library/react';

import { useUserStore, type SessionUser } from './useUserStore';

describe('useUserStore', () => {
  beforeEach(() => {
    act(() => {
      useUserStore.getState().reset();
    });
  });

  it('updates the user via setUser', () => {
    const agent: SessionUser = {
      id: 'neo',
      displayName: 'Neo',
      email: 'neo@zion.io',
      avatarUrl: 'https://zion.io/avatars/neo.png',
    };

    act(() => {
      useUserStore.getState().setUser(agent);
    });

    expect(useUserStore.getState().user).toEqual(agent);
  });

  it('toggles the loading flag with setIsLoading', () => {
    act(() => {
      useUserStore.getState().setIsLoading(false);
    });

    expect(useUserStore.getState().isLoading).toBe(false);
  });

  it('resets to the initial state', () => {
    act(() => {
      useUserStore.getState().setUser({
        id: 'trinity',
        displayName: 'Trinity',
        email: 'trinity@zion.io',
      });
      useUserStore.getState().setIsLoading(false);
    });

    act(() => {
      useUserStore.getState().reset();
    });

    expect(useUserStore.getState()).toMatchObject({
      user: null,
      isLoading: true,
    });
  });
});
