import { useChatStore } from 'react-actions-chat';
import {
  createDefaultAssistantMessage,
  createDefaultErrorMessage,
} from './messages';
import { createChatTextGenerationContext } from './transcript';
import type {
  ChatTextGenerationFlow,
  ChatTextGenerationFlowConfig,
  ChatTextGenerationFlowMessage,
} from './types';
import type { GeneratedText } from '../textGenerationBackend';

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
    const context = createChatTextGenerationContext({
      chatMessages,
      systemPrompt,
    });

    setLoading(true);

    try {
      const result = await generator.generateText({
        messages: context.llmMessages,
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
