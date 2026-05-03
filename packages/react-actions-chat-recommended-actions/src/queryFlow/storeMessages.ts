import { getMessageRawText, useChatStore } from 'react-actions-chat';
import type {
  QueryRecommendedActionsContext,
  QueryRecommendedActionsMessageDraft,
} from './types';

/**
 * Creates the recommendation context for a submitted query.
 *
 * @param query - Submitted query text.
 */
export function createQueryRecommendedActionsContext(
  query: string
): QueryRecommendedActionsContext {
  return {
    query,
    messages: useChatStore.getState().getMessages(),
  };
}

/**
 * Adds a loading message and returns its generated message id when available.
 *
 * @param loadingLabel - Loading label shown while the recommendation resolves.
 */
export function addRecommendationLoadingMessage(
  loadingLabel: string
): number | undefined {
  const { addMessage, getPreviousMessage } = useChatStore.getState();

  addMessage({
    type: 'other',
    parts: [],
    isLoading: true,
    loadingLabel,
  });

  return getPreviousMessage()?.id;
}

/**
 * Removes a chat message when the message id is known.
 *
 * @param messageId - Message id to remove from the chat transcript.
 */
export function removeMessageById(messageId: number | undefined): void {
  if (messageId === undefined) {
    return;
  }

  const { getMessages, setMessages } = useChatStore.getState();
  setMessages(getMessages().filter(message => message.id !== messageId));
}

/**
 * Adds or replaces the pending recommendation response message.
 *
 * @param loadingMessageId - Loading message id to replace when available.
 * @param pendingMessage - Message draft created from recommendation results.
 */
export function resolveRecommendationMessage(
  loadingMessageId: number | undefined,
  pendingMessage: QueryRecommendedActionsMessageDraft
): void {
  const { addMessage, getMessages, setMessages } = useChatStore.getState();

  if (loadingMessageId === undefined) {
    addMessage({
      type: 'other',
      parts: pendingMessage.parts,
      ...(pendingMessage.buttons ? { buttons: pendingMessage.buttons } : {}),
    });
    return;
  }

  setMessages(
    getMessages().map(message => {
      if (message.id !== loadingMessageId) {
        return message;
      }

      const {
        isLoading: _isLoading,
        loadingLabel: _loadingLabel,
        ...resolvedMessage
      } = message;

      return {
        ...resolvedMessage,
        type: 'other',
        parts: pendingMessage.parts,
        rawContent: getMessageRawText(pendingMessage.parts),
        isLoading: false,
        ...(pendingMessage.buttons
          ? { buttons: pendingMessage.buttons }
          : { buttons: [] }),
      };
    })
  );
}
