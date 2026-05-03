import {
  Chat,
  InputBar,
  Message as MessageComponent,
  MessageList,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
} from './components';
import type {
  AnyButtonDefinition,
  ButtonDefinition,
  ButtonRuntimeConfig,
  CreatedButton,
  RequestConfirmationButtonDefinition,
  RequestConfirmationButtonRuntimeConfig,
  RequestInputButtonDefinition,
  RequestInputButtonRuntimeConfig,
  RequestInputRateLimit,
} from './components';
import {
  createFilePart,
  createImagePart,
  createMarkdownTextPart,
  createTextPart,
} from './js/types';
import type {
  ChatProps,
  ChatPropsWithFlexibleTheme,
  ChatTheme,
  FileMessagePart,
  ImageMessagePart,
  InputBarBehaviorConfig,
  InputBarModeConfig,
  InputBarValidationConfig,
  InputMessage,
  Message as MessageData,
  MessageButton,
  MessageButtonVariant,
  MessagePart,
  MessagePartRenderer,
  MessagePartRendererProps,
  MessageType,
  MarkdownTextPartOptions,
  TextMessageFormat,
  TextMessagePart,
} from './js/types';
import type {
  ChatGlobals,
  InputSelectOption,
  RequestInputGlobalDefaults,
} from './lib';

export {
  Chat,
  InputBar,
  MessageComponent as Message,
  MessageList,
  createButton,
  createFilePart,
  createImagePart,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  createMarkdownTextPart,
  createTextPart,
};
export type {
  AnyButtonDefinition,
  ButtonDefinition,
  ButtonRuntimeConfig,
  ChatProps,
  ChatPropsWithFlexibleTheme,
  ChatGlobals,
  ChatTheme,
  CreatedButton,
  InputBarBehaviorConfig,
  InputBarModeConfig,
  InputBarValidationConfig,
  InputMessage,
  InputSelectOption,
  FileMessagePart,
  ImageMessagePart,
  MessageButton,
  MessageButtonVariant,
  MessagePart,
  MessagePartRenderer,
  MessagePartRendererProps,
  MessageType,
  MarkdownTextPartOptions,
  RequestConfirmationButtonDefinition,
  RequestConfirmationButtonRuntimeConfig,
  RequestInputButtonDefinition,
  RequestInputGlobalDefaults,
  RequestInputButtonRuntimeConfig,
  RequestInputRateLimit,
  TextMessageFormat,
  TextMessagePart,
};
/**
 * Backward-compatible alias for the normalized chat message type.
 */
export type Message = MessageData;
export * from './lib';
