import type {
  InputMessage,
  MessagePart,
  MessageType,
} from 'react-actions-chat';
import type {
  GeneratedText,
  LLMMessage,
  TextGenerator,
} from '../textGenerationBackend';

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
export type SystemPromptBuilder = (
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
