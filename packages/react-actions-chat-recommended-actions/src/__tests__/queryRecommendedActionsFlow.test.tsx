import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  createTextPart,
  useChatGlobalsStore,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import type { InputMessage, Message } from 'react-actions-chat';
import {
  buildVectorSearchButtonText,
  createQueryRecommendedActionsFlow,
  type EmbedTextOptions,
  type EmbeddingVector,
  type QueryRecommendedAction,
  type QueryRecommendedActionsContext,
  type QueryRecommendedActionsResolver,
  createVectorSearchQueryRecommendedActionsFlow,
  type TextEmbedder,
  type VectorSearchButtonSearchAdapter,
} from 'react-actions-chat-recommended-actions';

type EmbedTexts = NonNullable<TextEmbedder['embedTexts']>;

function createTestEmbedding(
  normalizedText: string,
  options?: EmbedTextOptions
): EmbeddingVector {
  if (options?.inputType === 'query') {
    return normalizedText.includes('leave my account') ? [0, 0, 1] : [1, 0, 0];
  }

  return normalizedText.includes('sign out') ? [0, 0, 1] : [1, 0, 0];
}

function createEmbedTextsSpy() {
  return vi.fn<EmbedTexts>((texts, options) =>
    Promise.resolve(
      texts.map(text => createTestEmbedding(text.toLowerCase(), options))
    )
  );
}

function createTestEmbedder(embedTexts: EmbedTexts): TextEmbedder {
  return {
    embedText: async (text, options) => {
      const [embedding] = await embedTexts([text], options);
      return embedding ?? [];
    },
    embedTexts,
  };
}

function createInputMessage(
  text: string,
  message: Omit<InputMessage, 'parts'>
): InputMessage {
  return {
    ...message,
    parts: [createTextPart(text)],
  };
}

function getMessageText(message: Message | undefined): string {
  const firstPart = message?.parts[0];
  if (!firstPart || firstPart.type !== 'text') {
    return '';
  }

  return firstPart.text;
}

describe('Query Recommended Actions Flow', () => {
  beforeEach(() => {
    useChatGlobalsStore.getState().resetChatGlobals();
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useInputFieldStore.getState().setInputFieldValue('');
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldValidator();
    useInputFieldStore.getState().resetInputFieldSubmitGuard();
    useInputFieldStore.getState().resetInputFieldFiles();
    useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
    useInputFieldStore.getState().resetInputFieldDisabledDefault();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
    useInputFieldStore.getState().resetInputFieldDisabled();
  });

  it('collects a query and renders recommended action buttons', async () => {
    const user = userEvent.setup();
    const handleRecommendation = vi.fn();
    const getRecommendedActions = vi.fn<QueryRecommendedActionsResolver>(
      (query: string) => ({
        responseMessage: `Best next steps for "${query}"`,
        recommendedActions: [
          {
            label: 'Reset password',
            onClick: handleRecommendation,
            variant: 'info' as const,
          },
        ],
      })
    );
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Find help',
      queryPromptMessage: 'What would you like help with?',
      getRecommendedActions,
    });
    const initialMessages: InputMessage[] = [
      createInputMessage('Need something specific?', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
        buttons: [flow.button],
      }),
    ];

    render(<Chat initialMessages={initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Find help' }));

    expect(
      screen.getByText('What would you like help with?')
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'reset password'
    );
    await user.keyboard('{Enter}');

    await waitFor(() => expect(getRecommendedActions).toHaveBeenCalledTimes(1));

    const [submittedQuery, recommendationContext] = getRecommendedActions.mock
      .calls[0] as [string, QueryRecommendedActionsContext];
    expect(submittedQuery).toBe('reset password');
    expect(recommendationContext.query).toBe('reset password');
    expect(Array.isArray(recommendationContext.messages)).toBe(true);

    expect(
      await screen.findByText('Best next steps for "reset password"')
    ).toBeInTheDocument();

    const recommendationButton = screen.getByRole('button', {
      name: 'Reset password',
    });
    await user.click(recommendationButton);

    expect(handleRecommendation).toHaveBeenCalledTimes(1);
  }, 10_000);

  it('shows the empty state message when no recommendations are returned', async () => {
    const user = userEvent.setup();
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Search actions',
      queryPromptMessage: 'Describe what you want to do.',
      emptyStateMessage:
        'I could not find a matching action yet. Please try another search.',
      getRecommendedActions: () => [],
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Let us find the right action.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Search actions' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'refund status'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText(
        'I could not find a matching action yet. Please try another search.'
      )
    ).toBeInTheDocument();
  });

  it('shows the configured error message when recommendation lookup fails', async () => {
    const user = userEvent.setup();
    const onError = vi.fn(
      (
        _query: string,
        _error: unknown,
        _context: QueryRecommendedActionsContext
      ) => undefined
    );
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Recommend next steps',
      queryPromptMessage: 'What should we help you with?',
      errorMessage:
        'Something went wrong while loading recommendations. Please retry.',
      getRecommendedActions: () => {
        throw new Error('Lookup failed');
      },
      onError,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('I can suggest what to do next.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Recommend next steps' })
    );
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'close account'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText(
        'Something went wrong while loading recommendations. Please retry.'
      )
    ).toBeInTheDocument();

    expect(onError).toHaveBeenCalledTimes(1);
    const [submittedQuery, error, recommendationContext] = onError.mock
      .calls[0] as [string, unknown, QueryRecommendedActionsContext];
    expect(submittedQuery).toBe('close account');
    expect(error).toBeInstanceOf(Error);
    expect(recommendationContext.query).toBe('close account');
    expect(Array.isArray(recommendationContext.messages)).toBe(true);
  });

  it('blocks a query that is shorter than the configured minimum length', async () => {
    const user = userEvent.setup();
    const getRecommendedActions = vi.fn<QueryRecommendedActionsResolver>(
      () => []
    );
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Search actions',
      queryPromptMessage: 'Describe what you want to do.',
      minMessageLength: 5,
      minMessageLengthMessage: 'Please enter at least five characters.',
      getRecommendedActions,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Let us find the right action.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Search actions' }));

    const input = screen.getByPlaceholderText('Search for help topics...');
    await user.type(input, 'help');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Please enter at least five characters.')
    ).toBeInTheDocument();
    expect(getRecommendedActions).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while recommendations are resolving', async () => {
    const user = userEvent.setup();
    let resolveRecommendations:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Find help',
      queryPromptMessage: 'What would you like help with?',
      loadingMessage: 'Looking up the best next action...',
      getRecommendedActions: async () =>
        new Promise(resolve => {
          resolveRecommendations = resolve;
        }),
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Need something specific?', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Find help' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'change email'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('status', {
        name: 'Loading',
      })
    ).toBeInTheDocument();
    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message => message.isLoading)
    ).toBe(true);

    resolveRecommendations?.([{ label: 'Change Email' }]);

    expect(
      await screen.findByRole('button', { name: 'Change Email' })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('status', {
          name: 'Loading',
        })
      ).not.toBeInTheDocument();
    });
  });

  it('disables the shared input until recommendations resolve when configured to wait for turn', async () => {
    const user = userEvent.setup();
    let resolveRecommendations:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Find help',
      queryPromptMessage: 'What would you like help with?',
      shouldWaitForTurn: true,
      getRecommendedActions: async () =>
        new Promise(resolve => {
          resolveRecommendations = resolve;
        }),
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Need something specific?', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Find help' }));

    const input = screen.getByPlaceholderText('Search for help topics...');
    await user.type(input, 'change email');
    await user.keyboard('{Enter}');

    expect(input).toBeDisabled();
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);

    resolveRecommendations?.([{ label: 'Change Email' }]);

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);
    });
  });

  it('keeps loading visible for the configured minimum duration', async () => {
    vi.useFakeTimers();

    const flow = createQueryRecommendedActionsFlow({
      loadingMessage: 'Looking up the best next action...',
      minimumLoadingDurationMs: 500,
      getRecommendedActions: () => [],
    });

    const recommendPromise = flow.recommend('change email');

    expect(useChatStore.getState().getMessages()).toHaveLength(1);
    expect(useChatStore.getState().getMessages()[0]).toMatchObject({
      type: 'other',
      parts: [],
      isLoading: true,
      loadingLabel: 'Looking up the best next action...',
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(useChatStore.getState().getMessages()[0]?.isLoading).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await recommendPromise;

    expect(useChatStore.getState().getMessages()[0]?.isLoading).toBe(false);
    expect(useChatStore.getState().getMessages()[0]?.loadingLabel).toBe(
      undefined
    );

    vi.useRealTimers();
  });

  it('waits for loading to finish before showing the next message', async () => {
    vi.useFakeTimers();

    const flow = createQueryRecommendedActionsFlow({
      loadingMessage: 'Looking up the best next action...',
      minimumLoadingDurationMs: 500,
      getRecommendedActions: () => [
        {
          label: 'Change Email',
        },
      ],
    });

    const recommendPromise = flow.recommend('change email');

    expect(useChatStore.getState().getMessages()[0]?.isLoading).toBe(true);
    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message =>
          getMessageText(message).includes('recommended next steps')
        )
    ).toBe(false);

    await vi.advanceTimersByTimeAsync(499);
    expect(useChatStore.getState().getMessages()).toHaveLength(1);
    expect(useChatStore.getState().getMessages()[0]?.isLoading).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await recommendPromise;

    expect(useChatStore.getState().getMessages()[0]?.isLoading).toBe(false);
    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message =>
          getMessageText(message).includes('recommended next steps')
        )
    ).toBe(true);

    vi.useRealTimers();
  });

  it('cancels stale recommendation results when a newer query arrives', async () => {
    let resolveFirstRecommendation:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    let resolveSecondRecommendation:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    const flow = createQueryRecommendedActionsFlow({
      cancelInFlightOnNewInput: true,
      getRecommendedActions: query =>
        new Promise(resolve => {
          if (query === 'first query') {
            resolveFirstRecommendation = resolve;
            return;
          }

          resolveSecondRecommendation = resolve;
        }),
    });

    const firstPromise = flow.recommend('first query');

    expect(
      useChatStore
        .getState()
        .getMessages()
        .filter(message => message.isLoading)
    ).toHaveLength(1);

    const secondPromise = flow.recommend('second query');

    expect(
      useChatStore
        .getState()
        .getMessages()
        .filter(message => message.isLoading)
    ).toHaveLength(1);

    resolveSecondRecommendation?.([{ label: 'Second Result' }]);
    await secondPromise;

    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message => getMessageText(message).includes('"second query"'))
    ).toBe(true);

    resolveFirstRecommendation?.([{ label: 'First Result' }]);
    await firstPromise;

    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message => getMessageText(message).includes('"first query"'))
    ).toBe(false);
    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message =>
          message.buttons?.some(button => button.label === 'First Result')
        )
    ).toBe(false);
  });

  it('queues recommendation lookups when configured to wait their turn', async () => {
    let resolveFirstRecommendation:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    let resolveSecondRecommendation:
      | ((value: readonly QueryRecommendedAction[]) => void)
      | undefined;
    const getRecommendedActions = vi.fn<QueryRecommendedActionsResolver>(
      query =>
        new Promise(resolve => {
          if (query === 'first query') {
            resolveFirstRecommendation = resolve;
            return;
          }

          resolveSecondRecommendation = resolve;
        })
    );
    const flow = createQueryRecommendedActionsFlow({
      queueWhileWaiting: true,
      getRecommendedActions,
    });

    const firstPromise = flow.recommend('first query');
    const secondPromise = flow.recommend('second query');

    expect(getRecommendedActions).toHaveBeenCalledTimes(1);
    expect(getRecommendedActions.mock.calls[0]?.[0]).toBe('first query');

    resolveFirstRecommendation?.([{ label: 'First Result' }]);

    await waitFor(() => {
      expect(getRecommendedActions).toHaveBeenCalledTimes(2);
    });
    expect(getRecommendedActions.mock.calls[1]?.[0]).toBe('second query');

    resolveSecondRecommendation?.([{ label: 'Second Result' }]);

    await Promise.all([firstPromise, secondPromise]);

    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message => getMessageText(message).includes('"first query"'))
    ).toBe(true);
    expect(
      useChatStore
        .getState()
        .getMessages()
        .some(message => getMessageText(message).includes('"second query"'))
    ).toBe(true);
  });

  it('blocks an extra query when the flow rate limit is reached', async () => {
    const user = userEvent.setup();
    const getRecommendedActions = vi.fn<QueryRecommendedActionsResolver>(
      () => []
    );
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Search actions',
      queryPromptMessage: 'Describe what you want to do.',
      validator: () => 'Try a different search.',
      rateLimit: {
        maxMessages: 1,
        windowMs: 10_000,
        tooManyMessagesMessage: 'Please wait before trying another search.',
      },
      getRecommendedActions,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Let us find the right action.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Search actions' }));

    const input = screen.getByPlaceholderText('Search for help topics...');
    await user.type(input, 'refund');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Try a different search.')
    ).toBeInTheDocument();
    expect(getRecommendedActions).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'billing');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Please wait before trying another search.')
    ).toBeInTheDocument();
    expect(getRecommendedActions).not.toHaveBeenCalled();
    expect(
      useChatStore
        .getState()
        .getMessages()
        .filter(message => message.type === 'self')
    ).toHaveLength(1);
  });

  it('can be invoked directly from a user prompt without showing a trigger button', async () => {
    const user = userEvent.setup();
    const handleRecommendation = vi.fn();
    const flow = createQueryRecommendedActionsFlow({
      initialLabel: 'Unused trigger',
      queryPromptMessage: 'What do you need help with?',
      getRecommendedActions: query => [
        {
          label: `Recommended for ${query}`,
          onClick: handleRecommendation,
        },
      ],
    });

    render(
      <Chat
        allowFreeTextInput
        initialMessages={[
          createInputMessage('Tell me what you want to change.', {
            type: 'other',
            userResponseCallback: () => {
              const lastSelfMessage = [...useChatStore.getState().getMessages()]
                .reverse()
                .find(message => message.type === 'self');

              if (lastSelfMessage) {
                void flow.recommend(lastSelfMessage.rawContent);
              }
            },
          }),
        ]}
      />
    );

    await user.type(
      screen.getByPlaceholderText('Type your message...'),
      'change email'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText(
        'Here are the recommended next steps for "change email".'
      )
    ).toBeInTheDocument();

    const recommendationButton = screen.getByRole('button', {
      name: 'Recommended for change email',
    });
    await user.click(recommendationButton);

    expect(handleRecommendation).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Unused trigger' })
    ).not.toBeInTheDocument();
  });

  it('adds recommendation messages directly when no loading state is configured', async () => {
    const flow = createQueryRecommendedActionsFlow({
      buildRecommendationsMessage: query => `Suggestions for ${query}`,
      getRecommendedActions: () => [
        {
          label: 'Change Email',
        },
      ],
    });

    await flow.recommend('change email');

    expect(useChatStore.getState().getMessages()).toContainEqual(
      expect.objectContaining({
        type: 'other',
        parts: [createTextPart('Suggestions for change email')],
        buttons: [
          expect.objectContaining({
            label: 'Change Email',
          }),
        ],
      })
    );
  });

  it('starts the query flow programmatically', async () => {
    const flow = createQueryRecommendedActionsFlow({
      queryPromptMessage: 'Programmatic prompt',
      getRecommendedActions: () => [],
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Need something specific?', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    act(() => {
      flow.start();
    });

    expect(await screen.findByText('Programmatic prompt')).toBeInTheDocument();
  });

  it('falls back to adding a new message when the loading message cannot be located', async () => {
    const originalGetPreviousMessage =
      useChatStore.getState().getPreviousMessage;
    useChatStore.setState({
      getPreviousMessage: () => undefined,
    });

    const flow = createQueryRecommendedActionsFlow({
      getRecommendedActions: () => [
        {
          label: 'Change Email',
        },
      ],
    });

    try {
      await flow.recommend('change email');
    } finally {
      useChatStore.setState({
        getPreviousMessage: originalGetPreviousMessage,
      });
    }

    expect(useChatStore.getState().getMessages()).toContainEqual(
      expect.objectContaining({
        parts: [
          createTextPart(
            'Here are the recommended next steps for "change email".'
          ),
        ],
        buttons: [
          expect.objectContaining({
            label: 'Change Email',
          }),
        ],
      })
    );
  });

  it('supports in-memory vector search with precomputed embeddings', async () => {
    const user = userEvent.setup();
    const handleEmailAction = vi.fn();
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      initialLabel: 'Vector search',
      queryPromptMessage: 'What do you want to change?',
      buttons: [
        {
          id: 'email',
          label: 'Change Email',
          embedding: [1, 0, 0] as const,
        },
        {
          id: 'password',
          label: 'Change Password',
          embedding: [0, 1, 0] as const,
        },
      ],
      getButtonEmbedding: button => button.embedding,
      embedQuery: () => [0.95, 0.05, 0] as const,
      maxResults: 1,
      createAction: ({ match }) => ({
        label: match.button.label,
        onClick: handleEmailAction,
      }),
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Use vector search to find the right option.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Vector search' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'update my email address'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('button', { name: 'Change Email' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Change Password' })
    ).not.toBeInTheDocument();
  });

  it('supports document text embedding without precomputing document vectors', async () => {
    const user = userEvent.setup();
    const embedTextsSpy = createEmbedTextsSpy();
    const embedder = createTestEmbedder(embedTextsSpy);
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      initialLabel: 'Semantic search',
      queryPromptMessage: 'What should I help you do?',
      buttons: [
        {
          id: 'email',
          searchText: 'Change Email update email verification address',
          label: 'Change Email',
        },
        {
          id: 'logout',
          searchText:
            'Logout sign out leave the account get out of my account end session',
          label: 'Logout',
        },
      ],
      embedder,
      getButtonText: button => button.searchText,
      maxResults: 1,
      minScore: 0.2,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Describe what you want to do.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Semantic search' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'I want to leave my account'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('button', { name: 'Logout' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(embedTextsSpy).toHaveBeenCalledWith(
        [
          'Change Email update email verification address',
          'Logout sign out leave the account get out of my account end session',
        ],
        expect.objectContaining({
          inputType: 'document',
        })
      );
    });
  });

  it('automatically builds document text for vector search button definitions', async () => {
    const user = userEvent.setup();
    const embedTextsSpy = createEmbedTextsSpy();
    const embedder = createTestEmbedder(embedTextsSpy);
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      initialLabel: 'Semantic buttons',
      queryPromptMessage: 'What should I help you do?',
      buttons: [
        {
          ...createRequestInputButtonDef({
            id: 'email',
            initialLabel: 'Change Email',
            inputPromptMessage: 'Enter your new email address.',
          }),
          description: 'Update email verification address',
          exampleQueries: ['change my email'],
        },
        {
          ...createRequestConfirmationButtonDef({
            id: 'logout',
            initialLabel: 'Logout',
            confirmationMessage: 'Are you sure you want to logout?',
          }),
          description: 'Sign out leave the account end session',
          exampleQueries: ['get out of my account'],
        },
      ],
      embedder,
      maxResults: 1,
      minScore: 0.2,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage('Describe what you want to do.', {
            type: 'other',
            buttons: [flow.button],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Semantic buttons' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'I want to leave my account'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('button', { name: 'Logout' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(embedTextsSpy).toHaveBeenNthCalledWith(
        2,
        [
          'Change Email Update email verification address change my email',
          'Logout Sign out leave the account end session get out of my account',
        ],
        expect.objectContaining({
          inputType: 'document',
        })
      );
    });
  });

  it('passes embeddings into a custom vector search adapter', async () => {
    const user = userEvent.setup();
    const search = vi.fn<VectorSearchButtonSearchAdapter>(
      ({ queryEmbedding }) => {
        expect(queryEmbedding).toEqual([0.2, 0.8]);

        return [
          {
            button: {
              label: 'Reset password',
            },
            score: 0.92,
          },
        ];
      }
    );
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      initialLabel: 'Hosted search',
      queryPromptMessage: 'What do you need help with?',
      embedQuery: () => [0.2, 0.8] as const,
      search,
    });

    render(
      <Chat
        initialMessages={[
          createInputMessage(
            'Ask a question and I will search the vector index.',
            {
              type: 'other',
              buttons: [flow.button],
            }
          ),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Hosted search' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'I forgot my password'
    );
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'I forgot my password',
          queryEmbedding: [0.2, 0.8],
          maxResults: 3,
        })
      );
    });

    expect(
      await screen.findByRole('button', { name: 'Reset password' })
    ).toBeInTheDocument();
  });

  it('supports custom vector search result builders', async () => {
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      buttons: [
        {
          id: 'email',
          label: 'Change Email',
          embedding: [1, 0, 0] as const,
        },
      ],
      getButtonEmbedding: button => button.embedding,
      embedQuery: () => [1, 0, 0] as const,
      buildResult: ({ matches, query }) => ({
        responseMessage: `Best result for ${query}`,
        recommendedActions: matches.map(match => ({
          label: match.button.label,
        })),
      }),
    });

    await flow.recommend('change email');

    expect(useChatStore.getState().getMessages()).toContainEqual(
      expect.objectContaining({
        parts: [createTextPart('Best result for change email')],
        buttons: [
          expect.objectContaining({
            label: 'Change Email',
          }),
        ],
      })
    );
  });

  it('reports button embedding count mismatches through the flow error path', async () => {
    const onError = vi.fn();
    const embedder = createTestEmbedder(() => Promise.resolve([[1, 0, 0]]));
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      buttons: [
        {
          label: 'Change Email',
          description: 'Update my email',
        },
        {
          label: 'Logout',
          description: 'Leave my account',
        },
      ],
      embedder,
      onError,
    });

    await flow.recommend('change email');

    expect(onError).toHaveBeenCalledTimes(1);
    const [, error] = onError.mock.calls[0] as [string, Error];
    expect(error.message).toBe(
      'Button embedding count did not match the number of source buttons.'
    );
    expect(useChatStore.getState().getMessages()).toContainEqual(
      expect.objectContaining({
        parts: [
          createTextPart(
            'I hit a problem while looking up recommendations for "change email". Please try again.'
          ),
        ],
      })
    );
  });

  it('supports function-based error messages', async () => {
    const flow = createQueryRecommendedActionsFlow({
      errorMessage: (query, error) =>
        `Could not load actions for ${query}: ${error instanceof Error ? error.message : 'unknown'}`,
      getRecommendedActions: () => {
        throw new Error('Lookup failed');
      },
    });

    await flow.recommend('change email');

    expect(useChatStore.getState().getMessages()).toContainEqual(
      expect.objectContaining({
        parts: [
          createTextPart(
            'Could not load actions for change email: Lookup failed'
          ),
        ],
      })
    );
  });

  it('builds vector search text from label and initialLabel variants', () => {
    expect(
      buildVectorSearchButtonText({
        label: 'Reset Password',
        description: 'Help me change my password',
        exampleQueries: ['forgot password'],
      })
    ).toBe('Reset Password Help me change my password forgot password');

    expect(
      buildVectorSearchButtonText({
        ...createRequestInputButtonDef({
          initialLabel: 'Change Email',
          inputPromptMessage: 'Enter your email',
        }),
        description: 'Update my address',
      })
    ).toBe('Change Email Update my address');
  });
});
