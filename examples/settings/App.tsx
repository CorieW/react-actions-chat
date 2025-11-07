import { useMemo } from 'react';
import type { Message } from 'actionable-support-chat';
import {
  Chat,
  useChatStore,
  createRequestInputButton,
  createRequestConfirmationButton,
} from 'actionable-support-chat';

/**
 * Settings Example
 *
 * This example demonstrates a settings page with:
 * - Change email button
 * - Change password button
 * - Logout with confirmation
 */
export function App(): React.JSX.Element {
  const { addMessage } = useChatStore();

  // Handle email change
  const handleEmailChange = (newEmail: string): void => {
    // In a real app, this would call an API to update the email
    addMessage({
      type: 'other',
      content: `Email updated successfully! We sent a verification email to ${newEmail}.`,
    });
  };

  // Handle password change
  const handlePasswordChange = (): void => {
    // In a real app, this would call an API to update the password
    addMessage({
      type: 'other',
      content: 'Password changed successfully!',
    });
  };

  // Handle logout
  const handleLogout = (): void => {
    // In a real app, this would clear the session and redirect
    addMessage({
      type: 'other',
      content:
        'You have been logged out successfully. Thank you for using our service!',
    });
  };

  const INITIAL_MESSAGES: readonly Message[] = useMemo(
    () => [
      {
        id: 1,
        type: 'other',
        content: 'Welcome to Settings! What would you like to change?',
        timestamp: new Date(),
        buttons: [
          createRequestInputButton({
            initialLabel: 'Change Email',
            inputPromptMessage: 'Please enter your new email address:',
            inputType: 'email',
            placeholder: 'your.email@example.com',
            inputDescription:
              'We will send a verification email to this address',
            validator: (value: string) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
              }
              return true;
            },
            onInput: handleEmailChange,
          }),
          createRequestInputButton({
            initialLabel: 'Change Password',
            inputPromptMessage: 'Please enter your new password:',
            inputType: 'password',
            placeholder: 'Enter password',
            inputDescription:
              'Password must be at least 8 characters long and contain uppercase, lowercase, and a number',
            validator: (value: string) => {
              if (value.length < 8) {
                return 'Password must be at least 8 characters long';
              }
              if (!/[A-Z]/.test(value)) {
                return 'Password must contain at least one uppercase letter';
              }
              if (!/[a-z]/.test(value)) {
                return 'Password must contain at least one lowercase letter';
              }
              if (!/[0-9]/.test(value)) {
                return 'Password must contain at least one number';
              }
              return true;
            },
            onInput: handlePasswordChange,
          }),
          createRequestConfirmationButton({
            initialLabel: 'Logout',
            confirmationMessage:
              'Are you sure you want to logout? You will need to log in again to access your account.',
            variant: 'warning',
            confirmLabel: 'Yes, Logout',
            rejectLabel: 'Cancel',
            onConfirm: handleLogout,
            onReject: () => {
              addMessage({
                type: 'other',
                content: 'Logout cancelled. You remain logged in.',
              });
            },
          }),
        ],
      },
    ],
    []
  );

  return (
    <div className='min-h-screen bg-background'>
      <Chat initialMessages={INITIAL_MESSAGES} theme='dark' />
    </div>
  );
}
