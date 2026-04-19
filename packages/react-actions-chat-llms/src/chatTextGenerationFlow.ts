import {
  createMarkdownTextPart,
  createTextPart,
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

export interface ChatTextGenerationFlowMessage {
  readonly type: MessageType;
  readonly parts: readonly MessagePart[];
  readonly rawContent?: string | undefined;
  readonly isLoading?: boolean | undefined;
}

export interface ChatTextGenerationContext {
  readonly chatMessages: readonly ChatTextGenerationFlowMessage[];
  readonly llmMessages: readonly LLMMessage[];
}

type SystemPromptBuilder = (
  context: ChatTextGenerationContext
) => string | undefined;

export interface ChatTextGenerationFlowConfig {
  readonly generator: TextGenerator;
  readonly systemPrompt?: string | SystemPromptBuilder | undefined;
  readonly getMessages?:
    | (() => readonly ChatTextGenerationFlowMessage[])
    | undefined;
  readonly addMessage?: ((message: InputMessage) => void) | undefined;
  readonly setLoading?: ((isLoading: boolean) => void) | undefined;
  readonly createAssistantMessage?:
    | ((
        result: GeneratedText,
        context: ChatTextGenerationContext
      ) => InputMessage | Promise<InputMessage>)
    | undefined;
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
  readonly throwOnError?: boolean | undefined;
}

export interface ChatTextGenerationFlow {
  readonly respond: () => Promise<GeneratedText | null>;
  readonly respondToMessages: (
    messages: readonly ChatTextGenerationFlowMessage[]
  ) => Promise<GeneratedText | null>;
}

function getMessageText(message: ChatTextGenerationFlowMessage): string {
  const rawContent = message.rawContent?.trim();

  if (rawContent) {
    return rawContent;
  }

  return message.parts
    .map(part => part.text)
    .filter(text => text.trim().length > 0)
    .join('\n')
    .trim();
}

function toLLMRole(messageType: MessageType): 'assistant' | 'user' {
  return messageType === 'self' ? 'user' : 'assistant';
}

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

function resolveSystemPrompt(
  systemPrompt: string | SystemPromptBuilder | undefined,
  context: ChatTextGenerationContext
): string | undefined {
  if (typeof systemPrompt === 'function') {
    return systemPrompt(context);
  }

  return systemPrompt;
}

function createDefaultAssistantMessage(result: GeneratedText): InputMessage {
  return {
    type: 'other',
    parts: [createMarkdownTextPart(result.text)],
  };
}

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
