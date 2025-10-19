import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';

import LoginDialog from './LoginDialog';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  auth: {},
}));

describe('LoginDialog', () => {
  const defaultProps = () => ({
    isOpen: true,
    onClose: jest.fn(),
    onSwitchToRegister: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the dialog is closed', () => {
    const { container } = render(
      <LoginDialog
        isOpen={false}
        onClose={jest.fn()}
        onSwitchToRegister={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders the login form when open', () => {
    render(<LoginDialog {...defaultProps()} />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access Key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('submits credentials and shows success feedback', async () => {
    jest.useFakeTimers();
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});

    const onClose = jest.fn();
    render(<LoginDialog {...defaultProps()} onClose={onClose} />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByLabelText(/Email Address/i), 'neo@matrix.io');
    await user.type(screen.getByLabelText(/Access Key/i), 'trinity');
    await user.click(screen.getByRole('button', { name: /Connect/i }));

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'neo@matrix.io', 'trinity');

    await waitFor(() =>
      expect(
        screen.getByText('Connection established. Welcome back, operator.'),
      ).toBeInTheDocument(),
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows error feedback when authentication fails', async () => {
    const error = new FirebaseError('auth/error', 'Invalid credentials');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    render(<LoginDialog {...defaultProps()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email Address/i), 'neo@matrix.io');
    await user.type(screen.getByLabelText(/Access Key/i), 'bad-pass');
    await user.click(screen.getByRole('button', { name: /Connect/i }));

    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument(),
    );
  });

  it('resets the form when switching to registration', async () => {
    const props = defaultProps();
    render(<LoginDialog {...props} />);

    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Access Key/i) as HTMLInputElement;

    await user.type(emailInput, 'neo@matrix.io');
    await user.type(passwordInput, 'oracle');
    await user.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(props.onSwitchToRegister).toHaveBeenCalled();
    await waitFor(() => {
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });
});
