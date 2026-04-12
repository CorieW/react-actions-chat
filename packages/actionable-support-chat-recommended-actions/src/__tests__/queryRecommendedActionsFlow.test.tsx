import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  type InputMessage,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'actionable-support-chat';
import {
  createQueryRecommendedActionsFlow,
  type EmbedTextOptions,
  type EmbeddingVector,
  type QueryRecommendedAction,
  type QueryRecommendedActionsContext,
  type QueryRecommendedActionsResolver,
  createVectorSearchQueryRecommendedActionsFlow,
  type TextEmbedder,
  type VectorSearchButtonSearchAdapter,
} from 'actionable-support-chat-recommended-actions';

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

describe('Query Recommended Actions Flow', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useInputFieldStore.getState().setInputFieldValue('');
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldValidator();
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
      {
        id: 1,
        type: 'other',
        content: 'Need something specific?',
        timestamp: new Date(),
        buttons: [flow.button],
      },
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
  });

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
          {
            type: 'other',
            content: 'Let us find the right action.',
            buttons: [flow.button],
          },
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
          {
            type: 'other',
            content: 'I can suggest what to do next.',
            buttons: [flow.button],
          },
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
          {
            type: 'other',
            content: 'Need something specific?',
            buttons: [flow.button],
          },
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
      content: '',
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
        .some(message => message.content.includes('recommended next steps'))
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
        .some(message => message.content.includes('recommended next steps'))
    ).toBe(true);

    vi.useRealTimers();
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
        initialMessages={[
          {
            type: 'other',
            content: 'Tell me what you want to change.',
            userResponseCallback: () => {
              const lastSelfMessage = [...useChatStore.getState().getMessages()]
                .reverse()
                .find(message => message.type === 'self');

              if (lastSelfMessage) {
                void flow.recommend(lastSelfMessage.rawContent);
              }
            },
          },
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
          {
            type: 'other',
            content: 'Use vector search to find the right option.',
            buttons: [flow.button],
          },
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
          {
            type: 'other',
            content: 'Describe what you want to do.',
            buttons: [flow.button],
          },
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

  it('keeps legacy document-shaped configs working at runtime', async () => {
    const user = userEvent.setup();
    const embedTextsSpy = createEmbedTextsSpy();
    const embedder = createTestEmbedder(embedTextsSpy);
    const flow = createVectorSearchQueryRecommendedActionsFlow({
      initialLabel: 'Legacy search',
      queryPromptMessage: 'What should I help you do?',
      documents: [
        {
          label: 'Change Email',
          searchText: 'Change Email update email verification address',
        },
        {
          label: 'Logout',
          searchText:
            'Logout sign out leave the account get out of my account end session',
        },
      ],
      embedder,
      getDocumentText: (document: { searchText: string }) =>
        document.searchText,
      maxResults: 1,
      toAction: ({
        match,
      }: {
        match: { document: { label: string } } | { button: { label: string } };
      }) => ({
        label: 'document' in match ? match.document.label : match.button.label,
      }),
    } as never);

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Describe what you want to do.',
            buttons: [flow.button],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Legacy search' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'I want to leave my account'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('button', { name: 'Logout' })
    ).toBeInTheDocument();
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
          {
            type: 'other',
            content: 'Describe what you want to do.',
            buttons: [flow.button],
          },
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
          {
            type: 'other',
            content: 'Ask a question and I will search the vector index.',
            buttons: [flow.button],
          },
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
});
