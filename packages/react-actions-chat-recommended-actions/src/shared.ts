import type {
  Message,
  MessageButtonVariant,
  MessageType,
} from 'react-actions-chat';

/**
 * Serializable chat message shape sent to remote recommendation services.
 */
export interface RemoteRecommendedActionsMessage {
  /**
   * Stable chat message identifier from the local chat store.
   */
  readonly id: number;

  /**
   * Whether the message came from the user or the assistant side.
   */
  readonly type: MessageType;

  /**
   * Rendered content shown in the transcript.
   */
  readonly content: string;

  /**
   * Raw content preserved by the chat store for follow-up logic.
   */
  readonly rawContent: string;

  /**
   * ISO-8601 timestamp string for transport-safe serialization.
   */
  readonly timestamp: string;
}

/**
 * Serializable action reference returned by a backend recommendation service.
 */
export interface RemoteRecommendedAction<TData = unknown> {
  /**
   * Stable action id used to map the result back to a client-side button.
   */
  readonly id: string;

  /**
   * Optional label override applied on top of the registered client action.
   */
  readonly label?: string | undefined;

  /**
   * Optional variant override applied on top of the registered client action.
   */
  readonly variant?: MessageButtonVariant | undefined;

  /**
   * Optional metadata forwarded to custom client action factories.
   */
  readonly data?: TData | undefined;
}

/**
 * Request payload sent from the client helper to a backend recommendation API.
 */
export interface RemoteRecommendedActionsRequest {
  /**
   * User-entered recommendation query.
   */
  readonly query: string;

  /**
   * Serialized chat history available to the backend.
   */
  readonly messages: readonly RemoteRecommendedActionsMessage[];
}

/**
 * Response payload returned by a backend recommendation API.
 */
export interface RemoteRecommendedActionsResponse<TData = unknown> {
  /**
   * Optional assistant message rendered above the recommended buttons.
   */
  readonly responseMessage?: string | undefined;

  /**
   * Serializable action references returned by the backend.
   */
  readonly recommendedActions?:
    | readonly RemoteRecommendedAction<TData>[]
    | undefined;
}

/**
 * Error response returned by the server helper for invalid requests or failures.
 */
export interface RemoteRecommendedActionsErrorResponse {
  /**
   * Human-readable error message for the client.
   */
  readonly message: string;
}

/**
 * Converts chat store messages into the serializable wire format used by the
 * remote recommendation helpers.
 */
export function serializeRecommendedActionsMessages(
  messages: readonly Pick<
    Message,
    'id' | 'type' | 'content' | 'rawContent' | 'timestamp'
  >[]
): readonly RemoteRecommendedActionsMessage[] {
  return messages.map(message => ({
    id: message.id,
    type: message.type,
    content: message.content,
    rawContent: message.rawContent,
    timestamp: message.timestamp.toISOString(),
  }));
}
