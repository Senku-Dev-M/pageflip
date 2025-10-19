import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import RegisterDialog from './RegisterDialog';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  auth: {},
}));

describe('RegisterDialog', () => {
  const defaultProps = () => ({
    isOpen: true,
    onClose: jest.fn(),
    onSwitchToLogin: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the dialog is closed', () => {
    const { container } = render(
      <RegisterDialog
        isOpen={false}
        onClose={jest.fn()}
        onSwitchToLogin={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all required fields when open', () => {
    render(<RegisterDialog {...defaultProps()} />);

    expect(screen.getByLabelText(/Codename/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email Address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Access Key$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Access Key/i)).toBeInTheDocument();
  });

  it('prevents submission when passwords do not match', async () => {
    render(<RegisterDialog {...defaultProps()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Codename/i), 'Trinity');
    await user.type(screen.getByLabelText(/^Email Address$/i), 'trinity@zion.io');
    await user.type(screen.getByLabelText(/^Access Key$/i), 'matrix');
    await user.type(screen.getByLabelText(/Confirm Access Key/i), 'nebuchadnezzar');
    await user.click(screen.getByRole('button', { name: /^Register$/i }));

    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    expect(
      screen.getByText('Access keys do not match. Recalibrate and try again.'),
    ).toBeInTheDocument();
  });

  it('registers the user and updates the profile on success', async () => {
    jest.useFakeTimers();
    const credential = { user: { uid: '1' } };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(credential);

    const onClose = jest.fn();
    render(<RegisterDialog {...defaultProps()} onClose={onClose} />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByLabelText(/Codename/i), '  Trinity  ');
    await user.type(screen.getByLabelText(/^Email Address$/i), 'trinity@zion.io');
    await user.type(screen.getByLabelText(/^Access Key$/i), 'matrix');
    await user.type(screen.getByLabelText(/Confirm Access Key/i), 'matrix');
    await user.click(screen.getByRole('button', { name: /^Register$/i }));

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'trinity@zion.io',
      'matrix',
    );

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(credential.user, {
        displayName: 'Trinity',
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByText('Registration successful. Credentials synced with the network.'),
      ).toBeInTheDocument(),
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows error feedback when registration fails', async () => {
    const error = new FirebaseError('auth/error', 'Registration denied');
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    render(<RegisterDialog {...defaultProps()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Codename/i), 'Neo');
    await user.type(screen.getByLabelText(/^Email Address$/i), 'neo@zion.io');
    await user.type(screen.getByLabelText(/^Access Key$/i), 'matrix');
    await user.type(screen.getByLabelText(/Confirm Access Key/i), 'matrix');
    await user.click(screen.getByRole('button', { name: /^Register$/i }));

    await waitFor(() =>
      expect(screen.getByText('Registration denied')).toBeInTheDocument(),
    );
  });

  it('resets the form when switching back to login', async () => {
    const props = defaultProps();
    render(<RegisterDialog {...props} />);

    const user = userEvent.setup();
    const codenameInput = screen.getByLabelText(/Codename/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/^Email Address$/i) as HTMLInputElement;

    await user.type(codenameInput, 'Morpheus');
    await user.type(emailInput, 'morpheus@zion.io');
    await user.click(screen.getByRole('button', { name: /Log In/i }));

    expect(props.onSwitchToLogin).toHaveBeenCalled();
    await waitFor(() => {
      expect(codenameInput.value).toBe('');
      expect(emailInput.value).toBe('');
    });
  });
});
