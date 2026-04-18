import { useMemo } from 'react';
import {
  Chat,
  createButton,
  createRequestInputButtonDef,
  createRequestConfirmationButtonDef,
  createTextPart,
  useChatStore,
  useInputFieldStore,
} from 'react-actions-chat';
import type { InputMessage, MessageButton } from 'react-actions-chat';
import {
  createOpenAITextEmbedder,
  createVectorSearchQueryRecommendedActionsFlow,
  type VectorSearchButtonDefinition,
} from 'react-actions-chat-recommended-actions';

type SettingsExampleMode = 'auto' | 'fallback' | 'live';

const MINIMUM_FALLBACK_LOADING_DURATION_MS = 150;
const RECOMMENDATION_WAIT_PLACEHOLDER = 'Finding the best settings action...';

function resolveSettingsExampleMode(
  rawMode: string | undefined
): SettingsExampleMode {
  if (rawMode === 'fallback' || rawMode === 'live' || rawMode === 'auto') {
    return rawMode;
  }

  return 'auto';
}

function getMissingConfigurationMessage(
  settingsExampleMode: SettingsExampleMode
): string {
  switch (settingsExampleMode) {
    case 'fallback':
      return 'This build is running in fallback mode, so live settings recommendations stay disabled. Switch VITE_SETTINGS_EXAMPLE_MODE back to auto or live to re-enable the real OpenAI embedder.';
    case 'live':
      return 'Live mode requires VITE_OPENAI_API_KEY before this example can request real OpenAI embeddings.';
    case 'auto':
    default:
      return 'Set VITE_OPENAI_API_KEY in examples/settings/.env.local to use the real OpenAI embedder in this example.';
  }
}

function getWelcomeMessage(
  settingsExampleMode: SettingsExampleMode,
  isOpenAIConfigured: boolean
): string {
  if (settingsExampleMode === 'fallback') {
    return 'Welcome to Settings. This build is running in fallback mode, so recommendation requests stay local until you switch VITE_SETTINGS_EXAMPLE_MODE back to auto or live.';
  }

  if (isOpenAIConfigured) {
    return 'Welcome to Settings. Tell me what you want to change, and I will use real OpenAI embeddings to recommend actions like changing your email, updating your phone number, enabling 2FA, deleting your account, or logging out.';
  }

  if (settingsExampleMode === 'live') {
    return 'Welcome to Settings. Live mode requires VITE_OPENAI_API_KEY before this example can request real OpenAI embeddings. Once the key is available, you can ask about changing your email, updating your phone number, enabling 2FA, deleting your account, or logging out.';
  }

  return 'Welcome to Settings. Add VITE_OPENAI_API_KEY to examples/settings/.env.local before sending a request. This example uses real OpenAI embeddings to recommend actions like changing your email, updating your phone number, enabling 2FA, deleting your account, or logging out.';
}

function waitForMs(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

/**
 * Settings Example
 *
 * This example demonstrates a settings page with:
 * - Automatic query-based recommendations for the right settings action
 * - The companion recommended-actions package with a real OpenAI embedder
 *
 * This uses a browser-side API key for demonstration so the example stays
 * self-contained. In a production app, route embedding requests through your
 * own backend instead of exposing a provider key to the client.
 */
export function App(): React.JSX.Element {
  const { addMessage, getMessages, setMessages } = useChatStore();
  const settingsExampleMode = resolveSettingsExampleMode(
    import.meta.env.VITE_SETTINGS_EXAMPLE_MODE
  );
  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim() ?? '';
  const isOpenAIConfigured =
    settingsExampleMode !== 'fallback' && openAIApiKey !== '';

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
      addContinuingMessage(
        `Email updated successfully! We sent a verification email to ${newEmail}.`
      );
    },
  });

  const CHANGE_PASSWORD_BUTTON_DEF = createRequestInputButtonDef({
    id: 'password',
    initialLabel: 'Change Password',
    inputPromptMessage: 'Please enter your new password:',
    inputType: 'password',
    placeholder: 'Enter password',
    shouldWaitForTurn: true,
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
      addContinuingMessage('Password changed successfully!');
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
      addContinuingMessage(`Display name updated to "${displayName.trim()}".`);
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
      addContinuingMessage(`Phone number updated to ${phoneNumber}.`);
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
      addContinuingMessage(
        'Two-factor authentication is now enabled for your account.'
      );
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
      addContinuingMessage(
        'You have been logged out successfully. Thank you for using our service!'
      );
    },
  });

  const handleTwoFactorCanceled = (): void => {
    addContinuingMessage(
      'Two-factor authentication stays off for now. You can enable it any time from settings.'
    );
  };

  const handleLogoutCanceled = (): void => {
    addContinuingMessage(
      'Stayed signed in. You can keep managing your settings.'
    );
  };

  const handleDeleteAccountCanceled = (): void => {
    addContinuingMessage(
      'Account kept. You can continue using your current settings without deleting anything.'
    );
  };

  const DELETE_ACCOUNT_BUTTON_DEF = createRequestConfirmationButtonDef({
    id: 'delete-account',
    initialLabel: 'Delete Account',
    confirmationMessage:
      'Are you sure you want to delete your account? This demo treats the action as permanent.',
    variant: 'error',
    confirmLabel: 'Delete Account',
    rejectLabel: 'Keep Account',
    onSuccess: (): void => {
      addContinuingMessage(
        'Your account deletion request has been submitted. You will receive a confirmation email shortly.'
      );
    },
  });

  const HELP_BUTTON = {
    label: 'Help',
    variant: 'info' as const,
    onClick: (): void => {
      addContinuingMessage(
        'Try asking about changing your email or password, updating your display name or phone number, enabling two-factor authentication, deleting your account, or logging out.'
      );
    },
  };

  function ensureHelpButton(
    buttons: readonly MessageButton[] | undefined
  ): readonly MessageButton[] {
    const resolvedButtons = buttons ?? [];

    if (resolvedButtons.some(button => button.label === HELP_BUTTON.label)) {
      return resolvedButtons;
    }

    return [...resolvedButtons, HELP_BUTTON];
  }

  function addContinuingMessage(text: string): void {
    addMessage({
      type: 'other',
      parts: [createTextPart(text)],
      buttons: [HELP_BUTTON],
      userResponseCallback: () => {
        const lastSelfMessage = [...getMessages()]
          .reverse()
          .find(message => message.type === 'self');

        if (lastSelfMessage) {
          void settingsRecommendationFlow.recommend(lastSelfMessage.rawContent);
        }
      },
    });
  }

  const handleInputRequestAborted = (): void => {
    addContinuingMessage(
      'Stopped that update. You can pick another settings action or describe something else to change.'
    );
  };

  const SETTING_BUTTON_DEFINITIONS: readonly VectorSearchButtonDefinition[] = [
    {
      ...CHANGE_EMAIL_BUTTON_DEF,
      description:
        'Update the email address on the account and send a verification email to the new address.',
      exampleQueries: [
        'change my email',
        'update my email address',
        'use a different email',
        'fix the email on my account',
        'replace the email linked to my account',
      ],
    },
    {
      ...CHANGE_PASSWORD_BUTTON_DEF,
      description:
        'Reset or change the account password to improve account security and sign-in access.',
      exampleQueries: [
        'change my password',
        'reset my password',
        'I forgot my password',
        'secure my login',
        'I cannot sign in with my password',
      ],
    },
    {
      ...CHANGE_DISPLAY_NAME_BUTTON_DEF,
      description:
        'Update the profile display name shown in the account and support notifications.',
      exampleQueries: [
        'change my display name',
        'update my profile name',
        'rename my account',
        'use a different name',
        'edit the name on my profile',
      ],
    },
    {
      ...CHANGE_PHONE_NUMBER_BUTTON_DEF,
      description:
        'Update the phone number used for account recovery and verification codes.',
      exampleQueries: [
        'change my phone number',
        'update my mobile number',
        'use a different phone for verification',
        'fix my recovery number',
        'replace the phone on my account',
      ],
    },
    {
      ...ENABLE_TWO_FACTOR_BUTTON_DEF,
      description:
        'Enable two-factor authentication to make account sign-in more secure.',
      exampleQueries: [
        'turn on two-factor authentication',
        'enable 2fa',
        'make my login more secure',
        'add verification codes to sign in',
        'set up extra login security',
      ],
    },
    {
      ...LOGOUT_BUTTON_DEF,
      description:
        'Sign out of the current account and end the active session on this device.',
      exampleQueries: [
        'log me out',
        'sign me out',
        'I want to get out of my account',
        'end my session',
        'leave this account',
      ],
    },
    {
      ...DELETE_ACCOUNT_BUTTON_DEF,
      description:
        'Delete the current account and start the account removal flow.',
      exampleQueries: [
        'delete my account',
        'close my account',
        'remove my profile',
        'erase this account',
        'permanently delete everything',
      ],
    },
  ];

  const settingsRecommendationFlow = useMemo(() => {
    const recommendationFlow = createVectorSearchQueryRecommendedActionsFlow({
      placeholder:
        'Try "update my phone number", "enable 2fa", or "delete my account"',
      inputDescription:
        'Describe what you want to change and I will recommend the best settings action.',
      abortCallback: handleInputRequestAborted,
      shouldWaitForTurn: true,
      buildResult: ({ query, matches }) => {
        if (matches.length === 0) {
          return {
            responseMessage: `I couldn't find any recommended actions for "${query}".`,
            recommendedActions: [HELP_BUTTON],
          };
        }

        return {
          recommendedActions: matches.map(match =>
            'kind' in match.button && match.button.kind === 'request-input'
              ? createButton(match.button, {
                  abortCallback: handleInputRequestAborted,
                })
              : match.button.id === 'two-factor-auth'
                ? createButton(match.button, {
                    onReject: handleTwoFactorCanceled,
                  })
                : match.button.id === 'logout'
                  ? createButton(match.button, {
                      onReject: handleLogoutCanceled,
                    })
                  : match.button.id === 'delete-account'
                    ? createButton(match.button, {
                        onReject: handleDeleteAccountCanceled,
                      })
                    : createButton(match.button)
          ),
        };
      },
      buildRecommendationsMessage: query =>
        `Here are the best settings actions I found for "${query}".`,
      loadingMessage: '',
      minimumLoadingDurationMs: 2000,
      embedder: createOpenAITextEmbedder({
        apiKey: openAIApiKey,
        model: 'text-embedding-3-large',
      }),
      buttons: SETTING_BUTTON_DEFINITIONS,
      maxResults: 5,
      onError: (query, error) => {
        addContinuingMessage(
          `Error recommending settings action for "${query}": ${error}`
        );
      },
      minScore: 0.2,
    });

    const runRecommendationCycle = async (query: string): Promise<void> => {
      const inputFieldStore = useInputFieldStore.getState();
      inputFieldStore.setInputFieldParams({
        disabledPlaceholder: RECOMMENDATION_WAIT_PLACEHOLDER,
        disabled: true,
      });

      if (!isOpenAIConfigured) {
        // Keep the waiting placeholder visible briefly so the example feels
        // like a real product flow instead of an ignored submission.
        await waitForMs(MINIMUM_FALLBACK_LOADING_DURATION_MS);
        addContinuingMessage(
          getMissingConfigurationMessage(settingsExampleMode)
        );
        inputFieldStore.resetInputFieldDisabled();
        return;
      }

      try {
        await recommendationFlow.recommend(query);
        addFindHelpButtonToLatestMessage();
      } finally {
        inputFieldStore.resetInputFieldDisabled();
      }
    };

    const handleNextTypedPrompt = (): void => {
      const lastSelfMessage = [...useChatStore.getState().getMessages()]
        .reverse()
        .find(candidate => candidate.type === 'self');

      if (lastSelfMessage) {
        void runRecommendationCycle(lastSelfMessage.rawContent);
      }
    };

    const addFindHelpButtonToLatestMessage = (): void => {
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
            buttons: ensureHelpButton(message.buttons),
            userResponseCallback: handleNextTypedPrompt,
          };
        })
      );
    };

    return {
      ...recommendationFlow,
      recommend: runRecommendationCycle,
    };
  }, [
    getMessages,
    isOpenAIConfigured,
    openAIApiKey,
    setMessages,
    settingsExampleMode,
  ]);

  const INITIAL_MESSAGES: readonly InputMessage[] = useMemo(
    () => [
      {
        id: 1,
        type: 'other',
        parts: [
          createTextPart(
            getWelcomeMessage(settingsExampleMode, isOpenAIConfigured)
          ),
        ],
        timestamp: new Date(),
        buttons: [HELP_BUTTON],
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
    [
      getMessages,
      isOpenAIConfigured,
      settingsExampleMode,
      settingsRecommendationFlow,
    ]
  );

  return (
    <div className='bg-background min-h-screen'>
      <Chat
        allowFreeTextInput
        initialMessages={INITIAL_MESSAGES}
        theme='dark'
      />
    </div>
  );
}
