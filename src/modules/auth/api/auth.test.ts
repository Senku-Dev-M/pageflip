import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { loginWithEmail, logout, registerWithEmail } from './auth';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/config/firebase', () => {
  const auth = { name: 'mock-auth' };
  return { auth };
});

const { auth: mockAuth } = jest.requireMock('@/config/firebase') as { auth: unknown };

describe('auth api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates loginWithEmail to Firebase auth', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue('credential');

    const result = await loginWithEmail('neo@matrix.io', 'thereisnospoon');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuth,
      'neo@matrix.io',
      'thereisnospoon',
    );
    expect(result).toBe('credential');
  });

  it('delegates registerWithEmail to Firebase auth', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue('new-credential');

    const result = await registerWithEmail('trinity@zion.io', 'matrix');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuth,
      'trinity@zion.io',
      'matrix',
    );
    expect(result).toBe('new-credential');
  });

  it('delegates logout to Firebase auth', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await logout();

    expect(signOut).toHaveBeenCalledWith(mockAuth);
  });
});
