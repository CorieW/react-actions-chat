import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chat,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  useChatStore,
  useInputFieldStore,
} from 'react-actions-chat';
import type { CreatedButton, InputMessage } from 'react-actions-chat';
import {
  createQueryRecommendedActionsFlow,
  createVectorSearchQueryRecommendedActionsFlow,
} from 'react-actions-chat-recommended-actions';
import {
  SETTINGS_RECOMMENDATION_DOCUMENTS,
  type SettingsRecommendationActionId,
} from '../server/settingsRecommendationCatalog';
import {
  createSettingsClientEmbedder,
  getSettingsEmbedderProvider,
  normalizeEmbedderApiKey,
  SETTINGS_EMBEDDER_PROVIDERS,
  type SettingsEmbedderProviderId,
} from './settingsClientEmbedder';

type SettingsClientActionId = SettingsRecommendationActionId | 'help';

interface SettingsRecommendationRuntimeFlow {
  readonly recommend: (query: string) => Promise<void>;
}

const PROVIDER_SELECTION_PLACEHOLDER = 'Choose an embedder provider first.';

/**
 * Settings Example
 *
 * This example demonstrates a settings page with:
 * - Automatic query-based recommendations for the right settings action
 * - The companion recommended-actions package with browser-side embeddings
 *
 * The transcript starts by asking which embedder provider to use, then asks for
 * that provider's API key before recommending settings actions.
 */
export function App(): React.JSX.Element {
  const { addMessage, getMessages, setMessages } = useChatStore();
  const initialMessagesRef = useRef<readonly InputMessage[] | null>(null);
  const settingsRecommendationFlowRef =
    useRef<SettingsRecommendationRuntimeFlow | null>(null);
  const [selectedProviderId, setSelectedProviderId] =
    useState<SettingsEmbedderProviderId | null>(null);
  const [loadedClientApiKeys, setLoadedClientApiKeys] = useState<
    Record<SettingsEmbedderProviderId, string>
  >({
    openai: '',
    cohere: '',
    gemini: '',
    voyage: '',
  });
  const lockedProviderId =
    selectedProviderId !== null &&
    loadedClientApiKeys[selectedProviderId] !== ''
      ? selectedProviderId
      : null;
  const selectedLoadedClientApiKey =
    selectedProviderId === null ? '' : loadedClientApiKeys[selectedProviderId];

  const clientEmbedder = useMemo(() => {
    if (selectedProviderId === null) {
      return null;
    }

    return createSettingsClientEmbedder({
      providerId: selectedProviderId,
      apiKey: selectedLoadedClientApiKey,
    });
  }, [selectedLoadedClientApiKey, selectedProviderId]);

  const resetInputForProviderSelection = (): void => {
    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldValue('');
    inputFieldStore.resetInputFieldDescription();
    inputFieldStore.resetInputFieldType();
    inputFieldStore.setInputFieldPlaceholder(PROVIDER_SELECTION_PLACEHOLDER);
    inputFieldStore.resetInputFieldValidator();
    inputFieldStore.setInputFieldDisabled(true);
  };

  const recommendLatestSettingsQuery = (): void => {
    const lastSelfMessage = [...useChatStore.getState().getMessages()]
      .reverse()
      .find(message => message.type === 'self');

    if (lastSelfMessage) {
      void settingsRecommendationFlowRef.current?.recommend(
        lastSelfMessage.rawContent
      );
    }
  };

  useEffect(() => {
    if (selectedProviderId === null) {
      resetInputForProviderSelection();
    }
  }, [selectedProviderId]);

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

  const createProviderSelectionButtons = (): readonly CreatedButton[] => {
    return SETTINGS_EMBEDDER_PROVIDERS.map(provider =>
      createButton({
        label: provider.label,
        onClick: () => {
          if (lockedProviderId !== null && provider.id !== lockedProviderId) {
            const lockedProvider =
              getSettingsEmbedderProvider(lockedProviderId);

            addMessage({
              type: 'other',
              content: `${lockedProvider.label} is already configured for this session. Switching embedders is disabled once setup is complete.`,
              buttons: createClientEmbedderSetupButtons(lockedProviderId),
            });
            return;
          }

          useInputFieldStore.getState().setInputFieldDisabled(false);
          setSelectedProviderId(provider.id);
          createProviderApiKeyButton(provider.id).onClick?.();
        },
      })
    );
  };

  const createProviderApiKeyButton = (
    providerId: SettingsEmbedderProviderId
  ): CreatedButton => {
    const provider = getSettingsEmbedderProvider(providerId);

    return createButton(
      createRequestInputButtonDef({
        id: `${provider.id}-api-key`,
        initialLabel: provider.label,
        inputPromptMessage: `Enter your ${provider.label} API key to turn on live recommendations.`,
        inputType: 'password',
        placeholder: provider.apiKeyPlaceholder,
        inputDescription: provider.description,
        validator: (value: string) => {
          if (normalizeEmbedderApiKey(value) === '') {
            return `Enter your ${provider.label} API key.`;
          }

          return true;
        },
      }),
      {
        abortCallback: () => {
          setSelectedProviderId(null);
          resetInputForProviderSelection();
          addMessage({
            type: 'other',
            content:
              'No problem. Choose an embedder provider when you are ready to continue.',
            buttons: createProviderSelectionButtons(),
          });
        },
        onValidInput: (apiKey: string) => {
          const normalizedApiKey = normalizeEmbedderApiKey(apiKey);

          setSelectedProviderId(providerId);
          setLoadedClientApiKeys(currentKeys => ({
            ...currentKeys,
            [providerId]: normalizedApiKey,
          }));
          addMessage({
            type: 'other',
            content: `${provider.label} API key loaded. Tell me what setting you want to change, and I will recommend the best action.`,
            userResponseCallback: recommendLatestSettingsQuery,
            buttons: createClientEmbedderSetupButtons(providerId),
          });
        },
      }
    );
  };

  const createClientEmbedderSetupButtons = (
    providerId: SettingsEmbedderProviderId | null
  ): readonly CreatedButton[] => {
    if (providerId === null) {
      return createProviderSelectionButtons();
    }

    return [];
  };

  const HELP_BUTTON = {
    label: 'Help',
    variant: 'info' as const,
    onClick: (): void => {
      const helpContent =
        lockedProviderId === null
          ? 'Try asking about changing your email or password, updating your display name or phone number, enabling two-factor authentication, deleting your account, or logging out. Choose an embedder provider below to get started.'
          : 'Try asking about changing your email or password, updating your display name or phone number, enabling two-factor authentication, deleting your account, or logging out.';

      addMessage({
        type: 'other',
        content: helpContent,
        buttons: createClientEmbedderSetupButtons(
          lockedProviderId ?? selectedProviderId
        ),
        userResponseCallback: () => {
          recommendLatestSettingsQuery();
        },
      });
    },
  };

  const settingsRecommendationFlow = useMemo(() => {
    const actions = {
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
      ReturnType<typeof createButton> | (() => ReturnType<typeof createButton>)
    >;

    const getAction = (actionId: SettingsClientActionId) => {
      const action = actions[actionId];
      return typeof action === 'function' ? action() : action;
    };

    const sharedFlowConfig = {
      placeholder:
        'Try "update my phone number", "enable 2fa", or "delete my account"',
      inputDescription:
        'Describe what you want to change and I will recommend the best settings action.',
      loadingMessage: '',
      minimumLoadingDurationMs: clientEmbedder ? 2000 : 0,
      onError: (query: string, error: unknown) => {
        addMessage({
          type: 'other',
          content: `Error recommending settings action for "${query}": ${error instanceof Error ? error.message : String(error)}`,
          buttons: createClientEmbedderSetupButtons(selectedProviderId),
        });
      },
    };

    const recommendationFlow = clientEmbedder
      ? createVectorSearchQueryRecommendedActionsFlow({
          ...sharedFlowConfig,
          buttons: SETTINGS_RECOMMENDATION_DOCUMENTS,
          embedder: clientEmbedder,
          maxResults: 5,
          minScore: 0.2,
          createAction: ({ match }) => getAction(match.button.id),
          buildResult: ({ matches, query }) => {
            if (matches.length === 0) {
              return {
                responseMessage: `I couldn't find any recommended actions for "${query}".`,
                recommendedActions: [getAction('help')],
              };
            }

            return {
              responseMessage: `Here are the best settings actions I found for "${query}".`,
              recommendedActions: matches.map(match =>
                getAction(match.button.id)
              ),
            };
          },
        })
      : createQueryRecommendedActionsFlow({
          ...sharedFlowConfig,
          getRecommendedActions: () => ({
            responseMessage:
              "Choose an embedder provider and load that provider's API key before asking me to recommend a settings action.",
            recommendedActions: [getAction('help')],
          }),
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
  }, [
    addMessage,
    clientEmbedder,
    getMessages,
    lockedProviderId,
    selectedProviderId,
    setMessages,
  ]);

  useEffect(() => {
    settingsRecommendationFlowRef.current = settingsRecommendationFlow;
  }, [settingsRecommendationFlow]);

  if (!initialMessagesRef.current) {
    initialMessagesRef.current = [
      {
        id: 1,
        type: 'other',
        content:
          "Welcome to Settings. First choose which embedder provider you want to use, then I will ask for that provider's API key before we start recommending settings actions.",
        buttons: createProviderSelectionButtons(),
      },
    ];
  }

  return (
    <div className='bg-background min-h-screen'>
      <Chat
        initialMessages={initialMessagesRef.current ?? []}
        theme='dark'
      />
    </div>
  );
}
