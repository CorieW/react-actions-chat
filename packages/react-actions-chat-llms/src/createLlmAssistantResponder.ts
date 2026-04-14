import type { InputMessage, Message } from 'react-actions-chat';
import { useChatStore } from 'react-actions-chat';
import type {
  GeneratedTextResult,
  LlmMessage,
  TextGenerator,
} from './providers';

type ChatMessageLike = Pick<
  Message,
  'content' | 'isLoading' | 'rawContent' | 'type'
>;

interface LlmAssistantResponderContext {
  readonly chatMessages: readonly Message[];
  readonly llmMessages: readonly LlmMessage[];
}

export interface LlmAssistantResponderConfig {
  readonly generator: TextGenerator;
  readonly systemPrompt?:
    | string
    | ((messages: readonly Message[]) => string | undefined)
    | undefined;
  readonly getMessages?: (() => readonly Message[]) | undefined;
  readonly addMessage?: ((message: InputMessage) => void) | undefined;
  readonly setLoading?: ((isLoading: boolean) => void) | undefined;
  readonly createAssistantMessage?:
    | ((
        result: GeneratedTextResult,
        context: LlmAssistantResponderContext
      ) => InputMessage | Promise<InputMessage>)
    | undefined;
  readonly createErrorMessage?:
    | ((
        error: unknown,
        context: LlmAssistantResponderContext
      ) => InputMessage | null | Promise<InputMessage | null>)
    | undefined;
  readonly throwOnError?: boolean | undefined;
}

export interface LlmAssistantResponder {
  readonly respond: () => Promise<GeneratedTextResult | null>;
  readonly respondToMessages: (
    messages: readonly Message[]
  ) => Promise<GeneratedTextResult | null>;
}

/**
 * Converts the transcript maintained by react-actions-chat into LLM messages.
 */
export function buildLlmMessagesFromChatMessages(
  messages: readonly ChatMessageLike[]
): readonly LlmMessage[] {
  const llmMessages: LlmMessage[] = [];

  messages
    .filter(message => !message.isLoading)
    .forEach(message => {
      const content = (message.rawContent ?? message.content).trim();

      if (content === '') {
        return;
      }

      llmMessages.push({
        role: message.type === 'self' ? 'user' : 'assistant',
        content,
      });
    });

  return llmMessages;
}

function getSystemPrompt(
  config: LlmAssistantResponderConfig,
  messages: readonly Message[]
): string | undefined {
  if (typeof config.systemPrompt === 'function') {
    return config.systemPrompt(messages);
  }

  return config.systemPrompt;
}

/**
 * Creates a responder that reads the current transcript, calls an LLM, and
 * appends the generated assistant reply back into the chat store.
 */
export function createLlmAssistantResponder(
  config: LlmAssistantResponderConfig
): LlmAssistantResponder {
  const defaultGetMessages = (): readonly Message[] =>
    useChatStore.getState().getMessages();
  const defaultAddMessage = (message: InputMessage): void => {
    useChatStore.getState().addMessage(message);
  };
  const defaultSetLoading = (isLoading: boolean): void => {
    useChatStore.getState().setLoading(isLoading);
  };
  const getMessages = config.getMessages ?? defaultGetMessages;
  const addMessage = config.addMessage ?? defaultAddMessage;
  const setLoading = config.setLoading ?? defaultSetLoading;

  const respondToMessages = async (
    chatMessages: readonly Message[]
  ): Promise<GeneratedTextResult | null> => {
    const llmMessages = buildLlmMessagesFromChatMessages(chatMessages);
    const systemPrompt = getSystemPrompt(config, chatMessages);
    const requestMessages = systemPrompt
      ? [
          {
            role: 'system',
            content: systemPrompt,
          } satisfies LlmMessage,
          ...llmMessages,
        ]
      : llmMessages;
    const context: LlmAssistantResponderContext = {
      chatMessages,
      llmMessages: requestMessages,
    };

    setLoading(true);

    try {
      const result = await config.generator.generateText({
        messages: requestMessages,
      });
      const assistantMessage = config.createAssistantMessage
        ? await config.createAssistantMessage(result, context)
        : ({
            type: 'other',
            content: result.text,
          } satisfies InputMessage);

      addMessage(assistantMessage);

      return result;
    } catch (error) {
      const errorMessage = config.createErrorMessage
        ? await config.createErrorMessage(error, context)
        : ({
            type: 'other',
            content:
              'Something went wrong while contacting the language model. Please try again.',
          } satisfies InputMessage);

      if (errorMessage) {
        addMessage(errorMessage);
      }

      if (config.throwOnError) {
        throw error;
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    respond: async () => {
      return respondToMessages(getMessages());
    },
    respondToMessages,
  };
}
