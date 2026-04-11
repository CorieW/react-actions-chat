import { useMemo } from "react";
import {
  Chat,
  createRequestInputButtonDef,
  createRequestConfirmationButtonDef,
  useChatStore,
} from "actionable-support-chat";
import type { InputMessage } from "actionable-support-chat";
import {
  createOpenAITextEmbedder,
  createVectorSearchQueryRecommendedActionsFlow,
  type VectorSearchButtonDefinition,
} from "actionable-support-chat-recommended-actions";

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
  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  const isOpenAIConfigured = openAIApiKey !== undefined && openAIApiKey !== "";

  const CHANGE_EMAIL_BUTTON_DEF = createRequestInputButtonDef({
    id: "email",
    initialLabel: "Change Email",
    inputPromptMessage: "Please enter your new email address:",
    inputType: "email",
    placeholder: "your.email@example.com",
    inputDescription: "We will send a verification email to this address",
    validator: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
      return true;
    },
    onSuccess: (newEmail: string): void => {
      // In a real app, this would call an API to update the email
      addMessage({
        type: "other",
        content: `Email updated successfully! We sent a verification email to ${newEmail}.`,
      });
    },
  });

  const CHANGE_PASSWORD_BUTTON_DEF = createRequestInputButtonDef({
    id: "password",
    initialLabel: "Change Password",
    inputPromptMessage: "Please enter your new password:",
    inputType: "password",
    placeholder: "Enter password",
    inputDescription:
      "Password must be at least 8 characters long and contain uppercase, lowercase, and a number",
    validator: (value: string) => {
      if (value.length < 8) {
        return "Password must be at least 8 characters long";
      }
      if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter";
      }
      if (!/[a-z]/.test(value)) {
        return "Password must contain at least one lowercase letter";
      }
      if (!/[0-9]/.test(value)) {
        return "Password must contain at least one number";
      }
      return true;
    },
    onSuccess: (): void => {
      addMessage({
        type: "other",
        content: "Password changed successfully!",
      });
    },
  });

  const LOGOUT_BUTTON_DEF = createRequestConfirmationButtonDef({
    id: "logout",
    initialLabel: "Logout",
    confirmationMessage:
      "Are you sure you want to logout? You will need to log in again to access your account.",
    variant: "error",
    confirmLabel: "Yes, Logout",
    rejectLabel: "Cancel",
    onSuccess: (): void => {
      addMessage({
        type: "other",
        content:
          "You have been logged out successfully. Thank you for using our service!",
      });
    },
  });

  const SETTING_BUTTON_DEFINITIONS: readonly VectorSearchButtonDefinition[] = [
    {
      ...CHANGE_EMAIL_BUTTON_DEF,
      description:
        "Update the email address on the account and send a verification email to the new address.",
      exampleQueries: [
        "change my email",
        "update my email address",
        "use a different email",
        "fix the email on my account",
        "replace the email linked to my account",
      ],
    },
    {
      ...CHANGE_PASSWORD_BUTTON_DEF,
      description:
        "Reset or change the account password to improve account security and sign-in access.",
      exampleQueries: [
        "change my password",
        "reset my password",
        "I forgot my password",
        "secure my login",
        "I cannot sign in with my password",
      ],
    },
    {
      ...LOGOUT_BUTTON_DEF,
      description:
        "Sign out of the current account and end the active session on this device.",
      exampleQueries: [
        "log me out",
        "sign me out",
        "I want to get out of my account",
        "end my session",
        "leave this account",
      ],
    },
  ];

  const settingsRecommendationFlow = useMemo(() => {
    const recommendationFlow = createVectorSearchQueryRecommendedActionsFlow({
      placeholder: 'Try "update my email" or "sign me out"',
      inputDescription:
        "Describe what you want to change and I will recommend the best settings action.",
      buildRecommendationsMessage: (query) =>
        `Here are the best settings actions I found for "${query}".`,
      emptyStateMessage:
        "I could not match that to a settings action yet. Try asking about email, password, or logging out.",
      loadingMessage: "",
      minimumLoadingDurationMs: 2000,
      embedder: createOpenAITextEmbedder({
        apiKey: openAIApiKey ?? "",
        model: "text-embedding-3-large",
      }),
      buttons: SETTING_BUTTON_DEFINITIONS,
      maxResults: 5,
      onError: (query, error) => {
        addMessage({
          type: "other",
          content: `Error recommending settings action for "${query}": ${error}`,
        });
      },
      minScore: 0.2,
    });

    const continueListeningForPrompts = (): void => {
      const messages = getMessages();
      const latestMessage = messages[messages.length - 1];

      if (latestMessage?.type !== "other") {
        return;
      }

      setMessages(
        messages.map((message) => {
          if (message.id !== latestMessage.id) {
            return message;
          }

          return {
            ...message,
            userResponseCallback: () => {
              const lastSelfMessage = [...useChatStore.getState().getMessages()]
                .reverse()
                .find((candidate) => candidate.type === "self");

              if (lastSelfMessage) {
                void runRecommendationCycle(lastSelfMessage.rawContent);
              }
            },
          };
        }),
      );
    };

    const runRecommendationCycle = async (query: string): Promise<void> => {
      if (!isOpenAIConfigured) {
        addMessage({
          type: "other",
          content:
            "Set VITE_OPENAI_API_KEY in examples/settings/.env.local to use the real OpenAI embedder in this example.",
        });
        return;
      }

      await recommendationFlow.recommend(query);
      continueListeningForPrompts();
    };

    return {
      ...recommendationFlow,
      recommend: runRecommendationCycle,
    };
  }, [addMessage, getMessages, isOpenAIConfigured, openAIApiKey, setMessages]);

  const INITIAL_MESSAGES: readonly InputMessage[] = useMemo(
    () => [
      {
        id: 1,
        type: "other",
        content: isOpenAIConfigured
          ? "Welcome to Settings. Tell me what you want to change, and I will use real OpenAI embeddings to recommend the right settings action."
          : "Welcome to Settings. Add VITE_OPENAI_API_KEY to examples/settings/.env.local before sending a request. This example uses real OpenAI embeddings to recommend the right settings action.",
        timestamp: new Date(),
        userResponseCallback: () => {
          const lastSelfMessage = [...getMessages()]
            .reverse()
            .find((message) => message.type === "self");

          if (lastSelfMessage) {
            void settingsRecommendationFlow.recommend(
              lastSelfMessage.rawContent,
            );
          }
        },
      },
    ],
    [getMessages, isOpenAIConfigured, settingsRecommendationFlow],
  );

  return (
    <div className="bg-background min-h-screen">
      <Chat initialMessages={INITIAL_MESSAGES} theme="dark" />
    </div>
  );
}
