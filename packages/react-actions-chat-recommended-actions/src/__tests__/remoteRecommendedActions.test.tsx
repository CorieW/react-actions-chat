import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createRemoteRecommendedActionsFlow,
  createRemoteRecommendedActionsHandler,
} from 'react-actions-chat-recommended-actions';

function createSerializedMessage(
  overrides?: Partial<{
    id: number;
    type: 'self' | 'other';
    content: string;
    rawContent: string;
    timestamp: string;
  }>
) {
  return {
    id: overrides?.id ?? 1,
    type: overrides?.type ?? ('self' as const),
    content: overrides?.content ?? 'Need help',
    rawContent: overrides?.rawContent ?? 'Need help',
    timestamp: overrides?.timestamp ?? '2026-04-14T10:00:00.000Z',
  };
}

describe('Remote Recommended Actions Helpers', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useInputFieldStore.getState().setInputFieldValue('');
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldValidator();
  });

  it('posts serialized chat messages to a backend and hydrates returned actions', async () => {
    const user = userEvent.setup();
    const handleResetPassword = vi.fn();
    const fetchSpy = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.method).toBe('POST');

      const requestBody = JSON.parse(String(init?.body)) as {
        query: string;
        messages: Array<Record<string, unknown>>;
      };

      expect(requestBody.query).toBe('reset password');
      expect(Array.isArray(requestBody.messages)).toBe(true);
      expect(
        requestBody.messages.some(
          message =>
            message.type === 'self' && message.rawContent === 'reset password'
        )
      ).toBe(true);
      expect(
        requestBody.messages.every(message => !('buttons' in message))
      ).toBe(true);

      return new Response(
        JSON.stringify({
          responseMessage: 'Here is the best next step.',
          recommendedActions: [
            {
              id: 'reset-password',
              label: 'Reset it for me',
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });
    const flow = createRemoteRecommendedActionsFlow({
      initialLabel: 'Find help',
      queryPromptMessage: 'What do you need help with?',
      endpoint: '/api/recommendations',
      fetch: fetchSpy,
      actions: {
        'reset-password': {
          label: 'Reset password',
          onClick: handleResetPassword,
          variant: 'info',
        },
      },
    });

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Describe the problem and I will find the next step.',
            buttons: [flow.button],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Find help' }));
    await user.type(
      screen.getByPlaceholderText('Search for help topics...'),
      'reset password'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Here is the best next step.')
    ).toBeInTheDocument();

    const hydratedButton = screen.getByRole('button', {
      name: 'Reset it for me',
    });
    await user.click(hydratedButton);

    expect(handleResetPassword).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns normalized JSON from the server helper', async () => {
    const handler = createRemoteRecommendedActionsHandler({
      recommend: ({ query }) => [
        {
          id: 'contact-support',
          label: `Get help with ${query}`,
        },
      ],
    });

    const response = await handler.handleRequest(
      new Request('https://example.test/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'billing',
          messages: [createSerializedMessage()],
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      recommendedActions: [
        {
          id: 'contact-support',
          label: 'Get help with billing',
        },
      ],
    });
  });

  it('returns a 400 response for invalid request payloads', async () => {
    const onError = vi.fn();
    const handler = createRemoteRecommendedActionsHandler({
      recommend: () => [],
      onError,
    });

    const response = await handler.handleRequest(
      new Request('https://example.test/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 123,
          messages: [],
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Recommendation request body must include a string query.',
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('returns the configured error message when recommendation resolution fails', async () => {
    const onError = vi.fn();
    const handler = createRemoteRecommendedActionsHandler({
      recommend: () => {
        throw new Error('Lookup failed');
      },
      errorMessage: 'Could not load recommendations.',
      onError,
    });

    const response = await handler.handleRequest(
      new Request('https://example.test/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'billing',
          messages: [createSerializedMessage()],
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Could not load recommendations.',
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
