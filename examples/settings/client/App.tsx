import { useMemo } from 'react';
import {
  Chat,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  useChatStore,
} from 'react-actions-chat';
import type { InputMessage } from 'react-actions-chat';
import { createRemoteRecommendedActionsFlow } from 'react-actions-chat-recommended-actions';

type SettingsClientActionId =
  | 'email'
  | 'password'
  | 'display-name'
  | 'phone-number'
  | 'two-factor-auth'
  | 'logout'
  | 'delete-account'
  | 'help';

/**
 * Settings Example
 *
 * This example demonstrates a settings page with:
 * - Automatic query-based recommendations for the right settings action
 * - The companion recommended-actions package with a backend recommendation API
 *
 * The browser sends recommendation queries to a local API endpoint and the
 * server uses a real OpenAI embedder. That keeps the API key off the client.
 */
export function App(): React.JSX.Element {
  const { addMessage, getMessages, setMessages } = useChatStore();

  const CHANGE_EMAIL_BUTTON_DEF = createRequestInputButtonDef({
    id: 'email',
    initialLabel: 'Change Email',
    inputPromptMessage: 'Please enter your new email address:',
    inputType: 'email',
    placeholder: 'your.email@example.com',
    inputDescription: 'We will send a verification email to this address',
    validator: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return true;
    },
    onSuccess: (newEmail: string): void => {
      addMessage({
        type: 'other',
        content: `Email updated successfully! We sent a verification email to ${newEmail}.`,
      });
    },
  });

  const CHANGE_PASSWORD_BUTTON_DEF = createRequestInputButtonDef({
    id: 'password',
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
    onSuccess: (): void => {
      addMessage({
        type: 'other',
        content: 'Password changed successfully!',
      });
    },
  });

  const CHANGE_DISPLAY_NAME_BUTTON_DEF = createRequestInputButtonDef({
    id: 'display-name',
    initialLabel: 'Update Display Name',
    inputPromptMessage: 'What display name would you like to use?',
    inputType: 'text',
    placeholder: 'Enter display name',
    inputDescription:
      'Your display name appears on your profile and in account notifications.',
    validator: (value: string) => {
      const trimmedValue = value.trim();

      if (trimmedValue.length < 2) {
        return 'Display name must be at least 2 characters long';
      }

      if (trimmedValue.length > 40) {
        return 'Display name must be 40 characters or less';
      }

      return true;
    },
    onSuccess: (displayName: string): void => {
      addMessage({
        type: 'other',
        content: `Display name updated to "${displayName.trim()}".`,
      });
    },
  });

  const CHANGE_PHONE_NUMBER_BUTTON_DEF = createRequestInputButtonDef({
    id: 'phone-number',
    initialLabel: 'Update Phone Number',
    inputPromptMessage: 'Please enter your new phone number:',
    inputType: 'tel',
    placeholder: '+44 7700 900123',
    inputDescription:
      'We use your phone number for account recovery and login verification.',
    validator: (value: string) => {
      const digitsOnly = value.replace(/\D/g, '');

      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Please enter a valid phone number';
      }

      return true;
    },
    onSuccess: (phoneNumber: string): void => {
      addMessage({
        type: 'other',
        content: `Phone number updated to ${phoneNumber}.`,
      });
    },
  });

  const ENABLE_TWO_FACTOR_BUTTON_DEF = createRequestConfirmationButtonDef({
    id: 'two-factor-auth',
    initialLabel: 'Enable Two-Factor Authentication',
    confirmationMessage:
      'Turn on two-factor authentication for this account? You will be asked for a verification code when signing in on a new device.',
    variant: 'info',
    confirmLabel: 'Enable 2FA',
    rejectLabel: 'Not Now',
    onSuccess: (): void => {
      addMessage({
        type: 'other',
        content: 'Two-factor authentication is now enabled for your account.',
      });
    },
  });

  const LOGOUT_BUTTON_DEF = createRequestConfirmationButtonDef({
    id: 'logout',
    initialLabel: 'Logout',
    confirmationMessage:
      'Are you sure you want to logout? You will need to log in again to access your account.',
    variant: 'error',
    confirmLabel: 'Yes, Logout',
    rejectLabel: 'Cancel',
    onSuccess: (): void => {
      addMessage({
        type: 'other',
        content:
          'You have been logged out successfully. Thank you for using our service!',
      });
    },
  });

  const DELETE_ACCOUNT_BUTTON_DEF = createRequestConfirmationButtonDef({
    id: 'delete-account',
    initialLabel: 'Delete Account',
    confirmationMessage:
      'Are you sure you want to delete your account? This demo treats the action as permanent.',
    variant: 'error',
    confirmLabel: 'Delete Account',
    rejectLabel: 'Keep Account',
    onSuccess: (): void => {
      addMessage({
        type: 'other',
        content:
          'Your account deletion request has been submitted. You will receive a confirmation email shortly.',
      });
    },
  });

  const HELP_BUTTON = {
    label: 'Help',
    variant: 'info' as const,
    onClick: (): void => {
      addMessage({
        type: 'other',
        content:
          'Try asking about changing your email or password, updating your display name or phone number, enabling two-factor authentication, deleting your account, or logging out.',
        userResponseCallback: () => {
          const lastSelfMessage = [...useChatStore.getState().getMessages()]
            .reverse()
            .find(message => message.type === 'self');

          if (lastSelfMessage) {
            void settingsRecommendationFlow.recommend(
              lastSelfMessage.rawContent
            );
          }
        },
      });
    },
  };

  const settingsRecommendationFlow = useMemo(() => {
    const recommendationFlow = createRemoteRecommendedActionsFlow({
      endpoint: '/api/recommendations',
      placeholder:
        'Try "update my phone number", "enable 2fa", or "delete my account"',
      inputDescription:
        'Describe what you want to change and I will recommend the best settings action.',
      actions: {
        email: () => createButton(CHANGE_EMAIL_BUTTON_DEF),
        password: () => createButton(CHANGE_PASSWORD_BUTTON_DEF),
        'display-name': () => createButton(CHANGE_DISPLAY_NAME_BUTTON_DEF),
        'phone-number': () => createButton(CHANGE_PHONE_NUMBER_BUTTON_DEF),
        'two-factor-auth': () => createButton(ENABLE_TWO_FACTOR_BUTTON_DEF),
        logout: () => createButton(LOGOUT_BUTTON_DEF),
        'delete-account': () => createButton(DELETE_ACCOUNT_BUTTON_DEF),
        help: HELP_BUTTON,
      } satisfies Record<
        SettingsClientActionId,
        | ReturnType<typeof createButton>
        | (() => ReturnType<typeof createButton>)
      >,
      loadingMessage: '',
      minimumLoadingDurationMs: 2000,
      onError: (query, error) => {
        addMessage({
          type: 'other',
          content: `Error recommending settings action for "${query}": ${error instanceof Error ? error.message : String(error)}`,
        });
      },
    });

    const continueListeningForPrompts = (): void => {
      const messages = getMessages();
      const latestMessage = messages[messages.length - 1];

      if (latestMessage?.type !== 'other') {
        return;
      }

      setMessages(
        messages.map(message => {
          if (message.id !== latestMessage.id) {
            return message;
          }

          return {
            ...message,
            userResponseCallback: () => {
              const lastSelfMessage = [...useChatStore.getState().getMessages()]
                .reverse()
                .find(candidate => candidate.type === 'self');

              if (lastSelfMessage) {
                void runRecommendationCycle(lastSelfMessage.rawContent);
              }
            },
          };
        })
      );
    };

    const runRecommendationCycle = async (query: string): Promise<void> => {
      await recommendationFlow.recommend(query);
      continueListeningForPrompts();
    };

    return {
      ...recommendationFlow,
      recommend: runRecommendationCycle,
    };
  }, [addMessage, getMessages, setMessages]);

  const INITIAL_MESSAGES: readonly InputMessage[] = useMemo(
    () => [
      {
        id: 1,
        type: 'other',
        content:
          'Welcome to Settings. Tell me what you want to change, and I will send your request to a local backend that uses real OpenAI embeddings to recommend actions like changing your email, updating your phone number, enabling 2FA, deleting your account, or logging out.',
        timestamp: new Date(),
        userResponseCallback: () => {
          const lastSelfMessage = [...getMessages()]
            .reverse()
            .find(message => message.type === 'self');

          if (lastSelfMessage) {
            void settingsRecommendationFlow.recommend(
              lastSelfMessage.rawContent
            );
          }
        },
      },
    ],
    [getMessages, settingsRecommendationFlow]
  );

  return (
    <div className='bg-background min-h-screen'>
      <Chat
        initialMessages={INITIAL_MESSAGES}
        theme='dark'
      />
    </div>
  );
}
