import { useMemo } from 'react';
import type { ChatFlow } from 'actionable-support-chat';
import {
  Chat,
  useChatStore,
  createRequestInputButton,
  createRequestConfirmationButton,
} from 'actionable-support-chat';

/**
 * Settings Example
 *
 * This example demonstrates built-in flow support:
 * - `settings-home` is the initial flow
 * - Button clicks trigger different flows
 * - Each flow seeds its own messages/buttons/behavior
 */
export function App(): React.JSX.Element {
  const { addMessage, startFlow } = useChatStore();

  const SETTINGS_HOME_FLOW: ChatFlow = useMemo(() => {
    let settingsHomeFlow!: ChatFlow;
    let changeEmailFlow!: ChatFlow;
    let changePasswordFlow!: ChatFlow;
    let logoutFlow!: ChatFlow;

    changeEmailFlow = {
      id: 'change-email',
      title: 'Change Email',
      metadata: {
        purpose: 'Update the account email and trigger verification',
      },
      initialMessages: [
        {
          type: 'other',
          content: 'Email Flow: update your email address.',
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
              onValidInput: (newEmail: string) => {
                // In a real app, this would call an API to update the email
                addMessage({
                  type: 'other',
                  content: `Email updated successfully! We sent a verification email to ${newEmail}.`,
                });
              },
            }),
            {
              label: 'Back to Settings',
              variant: 'dull',
              onClick: () => {
                startFlow(settingsHomeFlow);
              },
            },
          ],
        },
      ],
    };

    changePasswordFlow = {
      id: 'change-password',
      title: 'Change Password',
      metadata: {
        purpose: 'Capture and validate a new password',
      },
      initialMessages: [
        {
          type: 'other',
          content: 'Password Flow: update your password securely.',
          buttons: [
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
              onValidInput: () => {
                // In a real app, this would call an API to update the password
                addMessage({
                  type: 'other',
                  content: 'Password changed successfully!',
                });
              },
            }),
            {
              label: 'Back to Settings',
              variant: 'dull',
              onClick: () => {
                startFlow(settingsHomeFlow);
              },
            },
          ],
        },
      ],
    };

    logoutFlow = {
      id: 'logout',
      title: 'Logout',
      metadata: {
        purpose: 'Confirm intent before ending the active session',
      },
      initialMessages: [
        {
          type: 'other',
          content: 'Logout Flow: confirm if you want to sign out.',
          buttons: [
            createRequestConfirmationButton({
              initialLabel: 'Logout',
              confirmationMessage:
                'Are you sure you want to logout? You will need to log in again to access your account.',
              variant: 'error',
              confirmLabel: 'Yes, Logout',
              rejectLabel: 'Cancel',
              onConfirm: () => {
                // In a real app, this would clear the session and redirect
                addMessage({
                  type: 'other',
                  content:
                    'You have been logged out successfully. Thank you for using our service!',
                });
              },
              onReject: () => {
                addMessage({
                  type: 'other',
                  content: 'Logout cancelled. You remain logged in.',
                });
              },
            }),
            {
              label: 'Back to Settings',
              variant: 'dull',
              onClick: () => {
                startFlow(settingsHomeFlow);
              },
            },
          ],
        },
      ],
    };

    settingsHomeFlow = {
      id: 'settings-home',
      title: 'Settings Home',
      metadata: {
        purpose: 'Choose which settings flow to run',
      },
      initialMessage: {
        type: 'other',
        content:
          'Welcome to Settings. Choose a flow: Change Email, Change Password, or Logout.',
        buttons: [
          {
            label: 'Change Email Flow',
            onClick: () => {
              startFlow(changeEmailFlow);
            },
          },
          {
            label: 'Change Password Flow',
            onClick: () => {
              startFlow(changePasswordFlow);
            },
          },
          {
            label: 'Logout Flow',
            variant: 'error',
            onClick: () => {
              startFlow(logoutFlow);
            },
          },
        ],
      },
    };

    return settingsHomeFlow;
  }, [addMessage, startFlow]);

  return (
    <div className='min-h-screen bg-background'>
      <Chat initialFlow={SETTINGS_HOME_FLOW} theme='dark' />
    </div>
  );
}
