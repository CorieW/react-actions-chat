import { getMessageRawText, type MessageType } from 'react-actions-chat';
import type { LLMMessage } from '../textGenerationBackend';
import type {
  ChatTextGenerationContext,
  ChatTextGenerationFlowMessage,
  SystemPromptBuilder,
} from './types';

/**
 * Options used to build generation context from chat messages.
 */
interface CreateChatTextGenerationContextOptions {
  /**
   * Chat transcript messages available to the generation context.
   */
  readonly chatMessages: readonly ChatTextGenerationFlowMessage[];
  /**
   * System prompt or resolver prepended to LLM messages.
   */
  readonly systemPrompt?: string | SystemPromptBuilder | undefined;
}

/**
 * Returns the best text representation for a chat message.
 *
 * @param message - Message to inspect, format, or clone.
 */
export function getMessageText(message: ChatTextGenerationFlowMessage): string {
  const rawContent = message.rawContent?.trim();

  if (rawContent) {
    return rawContent;
  }

  return getMessageRawText(message.parts).trim();
}

/**
 * Maps a chat message side to the corresponding LLM message role.
 *
 * @param messageType - Chat message side to map into an LLM role.
 */
export function toLLMRole(messageType: MessageType): 'assistant' | 'user' {
  return messageType === 'self' ? 'user' : 'assistant';
}

/**
 * Converts chat transcript messages into LLM request messages.
 *
 * @param messages - Messages to inspect, format, or convert.
 */
export function collectLLMMessages(
  messages: readonly ChatTextGenerationFlowMessage[]
): readonly LLMMessage[] {
  return messages.flatMap(message => {
    if (message.isLoading) {
      return [];
    }

    const content = getMessageText(message);

    if (!content) {
      return [];
    }

    return [
      {
        role: toLLMRole(message.type),
        content,
      },
    ];
  });
}

/**
 * Resolves system prompt from caller configuration and defaults.
 *
 * @param systemPrompt - Static or dynamic system prompt configuration.
 * @param context - Context object available to this resolver.
 */
export function resolveSystemPrompt(
  systemPrompt: string | SystemPromptBuilder | undefined,
  context: ChatTextGenerationContext
): string | undefined {
  if (typeof systemPrompt === 'function') {
    return systemPrompt(context);
  }

  return systemPrompt;
}

/**
 * Creates the generation context passed to text generator and callbacks.
 *
 * @param options - Chat messages and prompt configuration used to build context.
 */
export function createChatTextGenerationContext({
  chatMessages,
  systemPrompt,
}: CreateChatTextGenerationContextOptions): ChatTextGenerationContext {
  const transcriptMessages = collectLLMMessages(chatMessages);
  const contextWithoutSystemPrompt: ChatTextGenerationContext = {
    chatMessages,
    llmMessages: transcriptMessages,
  };
  const resolvedSystemPrompt = resolveSystemPrompt(
    systemPrompt,
    contextWithoutSystemPrompt
  )?.trim();
  const llmMessages = resolvedSystemPrompt
    ? [
        {
          role: 'system' as const,
          content: resolvedSystemPrompt,
        },
        ...transcriptMessages,
      ]
    : transcriptMessages;

  return {
    chatMessages,
    llmMessages,
  };
}
