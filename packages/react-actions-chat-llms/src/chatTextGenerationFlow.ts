import {
  createMarkdownTextPart,
  createTextPart,
  getMessageRawText,
  useChatStore,
  type InputMessage,
  type MessagePart,
  type MessageType,
} from 'react-actions-chat';
import type {
  GeneratedText,
  LLMMessage,
  TextGenerator,
} from './textGenerationBackend';

/**
 * Chat message shape consumed when building LLM transcript input.
 */
export interface ChatTextGenerationFlowMessage {
  /**
   * Discriminant or input type for this value.
   */
  readonly type: MessageType;
  /**
   * Structured message parts rendered for the message.
   */
  readonly parts: readonly MessagePart[];
  /**
   * Original text content represented by the message.
   */
  readonly rawContent?: string | undefined;
  /**
   * Whether loading is true.
   */
  readonly isLoading?: boolean | undefined;
}

/**
 * Resolved transcript context passed to text-generation hooks.
 */
export interface ChatTextGenerationContext {
  /**
   * Chat transcript messages available to the generation context.
   */
  readonly chatMessages: readonly ChatTextGenerationFlowMessage[];
  /**
   * Transcript messages converted to LLM chat format.
   */
  readonly llmMessages: readonly LLMMessage[];
}

/**
 * Builds a system prompt from resolved transcript context.
 *
 * @param context - Context object available to this resolver.
 */
type SystemPromptBuilder = (
  context: ChatTextGenerationContext
) => string | undefined;

/**
 * Configuration for wiring chat transcript state to a text generator.
 */
export interface ChatTextGenerationFlowConfig {
  /**
   * Text generation implementation used by the flow.
   */
  readonly generator: TextGenerator;
  /**
   * System prompt or resolver prepended to LLM messages.
   */
  readonly systemPrompt?: string | SystemPromptBuilder | undefined;
  /**
   * Message selector used to read the chat transcript.
   */
  readonly getMessages?:
    | (() => readonly ChatTextGenerationFlowMessage[])
    | undefined;
  /**
   * Adds one message to the transcript.
   *
   * @param message - Message to add, inspect, or render.
   */
  readonly addMessage?: ((message: InputMessage) => void) | undefined;
  /**
   * Sets loading.
   *
   * @param isLoading - Loading state to apply.
   */
  readonly setLoading?: ((isLoading: boolean) => void) | undefined;
  /**
   * Creates assistant message.
   *
   * @param result - Generated text returned by the text generator.
   * @param context - Context available to the callback.
   */
  readonly createAssistantMessage?:
    | ((
        result: GeneratedText,
        context: ChatTextGenerationContext
      ) => InputMessage | Promise<InputMessage>)
    | undefined;
  /**
   * Creates the message shown when text generation fails.
   *
   * @param error - Error that caused the failure.
   * @param context - Context available to the callback.
   */
  readonly createErrorMessage?:
    | ((
        error: unknown,
        context: ChatTextGenerationContext
      ) =>
        | InputMessage
        | null
        | undefined
        | Promise<InputMessage | null | undefined>)
    | undefined;
  /**
   * Whether generation errors are rethrown after the error message is shown.
   */
  readonly throwOnError?: boolean | undefined;
}

/**
 * Runtime API for triggering transcript-aware text generation.
 */
export interface ChatTextGenerationFlow {
  /**
   * Triggers text generation for the current chat transcript.
   */
  readonly respond: () => Promise<GeneratedText | null>;
  /**
   * Generates a response from provided chat messages.
   *
   * @param messages - Messages to process.
   */
  readonly respondToMessages: (
    messages: readonly ChatTextGenerationFlowMessage[]
  ) => Promise<GeneratedText | null>;
}

/**
 * Returns the best text representation for a chat message.
 *
 * @param message - Message to inspect, format, or clone.
 */
function getMessageText(message: ChatTextGenerationFlowMessage): string {
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
function toLLMRole(messageType: MessageType): 'assistant' | 'user' {
  return messageType === 'self' ? 'user' : 'assistant';
}

/**
 * Converts chat transcript messages into LLM request messages.
 *
 * @param messages - Messages to inspect, format, or convert.
 */
function collectLLMMessages(
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
function resolveSystemPrompt(
  systemPrompt: string | SystemPromptBuilder | undefined,
  context: ChatTextGenerationContext
): string | undefined {
  if (typeof systemPrompt === 'function') {
    return systemPrompt(context);
  }

  return systemPrompt;
}

/**
 * Creates a default assistant message.
 *
 * @param result - Resolver or provider result to normalize.
 */
function createDefaultAssistantMessage(result: GeneratedText): InputMessage {
  return {
    type: 'other',
    parts: [createMarkdownTextPart(result.text)],
  };
}

/**
 * Creates a default error message.
 */
function createDefaultErrorMessage(): InputMessage {
  return {
    type: 'other',
    parts: [
      createTextPart(
        'Something went wrong while contacting the language model. Please try again.'
      ),
    ],
  };
}

/**
 * Creates a transcript-aware text generation flow.
 *
 * @param config - Text generator, transcript hooks, and message factory overrides.
 */
export function createChatTextGenerationFlow(
  config: ChatTextGenerationFlowConfig
): ChatTextGenerationFlow {
  const {
    generator,
    systemPrompt,
    throwOnError = false,
    getMessages = () => useChatStore.getState().getMessages(),
    addMessage = message => {
      useChatStore.getState().addMessage(message);
    },
    setLoading = isLoading => {
      useChatStore.getState().setLoading(isLoading);
    },
    createAssistantMessage = result => createDefaultAssistantMessage(result),
    createErrorMessage = () => createDefaultErrorMessage(),
  } = config;

  const respondToMessages = async (
    chatMessages: readonly ChatTextGenerationFlowMessage[]
  ): Promise<GeneratedText | null> => {
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
    const context: ChatTextGenerationContext = {
      chatMessages,
      llmMessages,
    };

    setLoading(true);

    try {
      const result = await generator.generateText({
        messages: llmMessages,
      });
      addMessage(await createAssistantMessage(result, context));
      return result;
    } catch (error) {
      const errorMessage = await createErrorMessage(error, context);

      if (errorMessage) {
        addMessage(errorMessage);
      }

      if (throwOnError) {
        throw error;
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    respond: async () => respondToMessages(getMessages()),
    respondToMessages,
  };
}
