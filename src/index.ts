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
import { createTextPart } from './js/types';
import type {
  ChatProps,
  ChatPropsWithFlexibleTheme,
  ChatTheme,
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
  TextMessagePart,
} from './js/types';
import type { ChatGlobals, RequestInputGlobalDefaults } from './lib';

export {
  Chat,
  InputBar,
  MessageComponent as Message,
  MessageList,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
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
  MessageButton,
  MessageButtonVariant,
  MessagePart,
  MessagePartRenderer,
  MessagePartRendererProps,
  MessageType,
  RequestConfirmationButtonDefinition,
  RequestConfirmationButtonRuntimeConfig,
  RequestInputButtonDefinition,
  RequestInputGlobalDefaults,
  RequestInputButtonRuntimeConfig,
  RequestInputRateLimit,
  TextMessagePart,
};
export type Message = MessageData;
export * from './lib';
