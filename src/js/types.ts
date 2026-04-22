import type {
  InputFileValidator,
  InputSubmission,
  InputSubmitGuard,
  InputType,
  InputValidator,
} from '../lib/inputFieldStore';
import type { ChatGlobals } from '../lib/chatGlobalsStore';

/**
 * Indicates whether a message is from the local user or the assistant side.
 */
export type MessageType = 'self' | 'other';

/**
 * Base shape shared by all message parts.
 */
interface BaseMessagePart {
  readonly id?: string | undefined;
}

/**
 * Formatting modes supported by text message parts.
 */
export type TextMessageFormat = 'plain' | 'markdown';

/**
 * Optional markdown-specific rendering settings for a text part.
 */
export interface MarkdownTextPartOptions {
  readonly syntaxHighlighting?: boolean | undefined;
}

/**
 * Text content rendered inside a message bubble.
 *
 * @property text The textual content to render.
 * @property format Optional formatting mode applied when the part is rendered.
 * @property markdownOptions Optional markdown-only rendering settings.
 */
export interface TextMessagePart extends BaseMessagePart {
  readonly type: 'text';
  readonly text: string;
  readonly format?: TextMessageFormat | undefined;
  readonly markdownOptions?: MarkdownTextPartOptions | undefined;
}

/**
 * Non-text file metadata shared by uploaded file and image parts.
 */
interface BaseAssetMessagePart extends BaseMessagePart {
  readonly fileName?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly sizeBytes?: number | undefined;
  readonly url: string;
}

/**
 * Image content rendered inline inside a message bubble.
 *
 * @property url Resolved image source URL.
 * @property alt Optional accessible description for the image.
 * @property fileName Optional original filename shown alongside the image.
 * @property mimeType Optional media type for the image.
 * @property sizeBytes Optional file size used for display metadata.
 * @property maxWidthPx Optional maximum preview width, in CSS pixels.
 * @property maxHeightPx Optional maximum preview height, in CSS pixels.
 */
export interface ImageMessagePart extends BaseAssetMessagePart {
  readonly type: 'image';
  readonly alt?: string | undefined;
  readonly maxWidthPx?: number | undefined;
  readonly maxHeightPx?: number | undefined;
}

/**
 * Generic file attachment rendered as a downloadable link.
 *
 * @property url Resolved download URL for the file.
 * @property fileName Optional original filename shown in the transcript.
 * @property mimeType Optional media type for the file.
 * @property sizeBytes Optional file size used for display metadata.
 */
export interface FileMessagePart extends BaseAssetMessagePart {
  readonly type: 'file';
}

/**
 * All built-in content part variants supported by a message.
 */
export type MessagePart = TextMessagePart | ImageMessagePart | FileMessagePart;

/**
 * Theme configuration for the chat component.
 *
 * @property primaryColor Color used for self messages and other primary surfaces.
 * @property secondaryColor Color used for assistant messages and secondary surfaces.
 * @property backgroundColor Background color of the chat container.
 * @property textColor Primary text color used across the chat UI.
 * @property borderColor Color used for borders and separators.
 * @property inputBackgroundColor Background color of the shared input field.
 * @property inputTextColor Text color used inside the shared input field.
 * @property buttonColor Background color used for primary buttons.
 * @property buttonTextColor Text color used on buttons.
 */
export interface ChatTheme {
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly borderColor?: string;
  readonly inputBackgroundColor?: string;
  readonly inputTextColor?: string;
  readonly buttonColor?: string;
  readonly buttonTextColor?: string;
}

/**
 * Variant type for message buttons.
 */
export type MessageButtonVariant =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'dull';

/**
 * Represents a button associated with a message.
 *
 * @property label Text shown on the button.
 * @property onClick Runs when the button is clicked.
 * @property variant Visual variant used to style the button.
 * @property className Optional CSS classes applied to the button.
 * @property style Optional inline styles that override the variant styles.
 * @property blocksInputWhileVisible When true, disables the shared input until the button is removed from the transcript.
 */
export interface MessageButton {
  readonly label: string;
  readonly onClick?: () => void | undefined;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
  readonly blocksInputWhileVisible?: boolean | undefined;
}

/**
 * Props passed to a part renderer.
 *
 * @property part The part being rendered.
 * @property message The parent message that owns the part.
 * @property theme Theme tokens used for styling.
 */
export interface MessagePartRendererProps<
  TPart extends MessagePart = MessagePart,
> {
  readonly part: TPart;
  readonly message: Message;
  readonly theme: ChatTheme;
}

/**
 * Contract for rendering a message part.
 */
export type MessagePartRenderer<TPart extends MessagePart = MessagePart> = (
  props: MessagePartRendererProps<TPart>
) => React.JSX.Element | null;

/**
 * Public mode configuration for the shared input bar.
 *
 * @property type Active HTML input type.
 * @property placeholder Placeholder text shown in the input.
 * @property description Helper text shown above the input.
 */
export interface InputBarModeConfig {
  readonly type: InputType;
  readonly placeholder?: string | undefined;
  readonly description?: string | undefined;
}

/**
 * Public validation configuration for the shared input bar.
 *
 * @property fileValidator Optional validator applied when files are attached.
 * @property validator Optional validator applied after the user submits.
 * @property submitGuard Optional guard used to block submission before a message is added.
 */
export interface InputBarValidationConfig {
  readonly fileValidator?: InputFileValidator | null | undefined;
  readonly validator?: InputValidator | null | undefined;
  readonly submitGuard?: InputSubmitGuard | null | undefined;
}

/**
 * Public behavior configuration for the shared input bar.
 *
 * @property disabled Whether the input is currently disabled.
 * @property disabledPlaceholder Optional placeholder shown while the input is disabled.
 * @property shouldWaitForTurn Whether the input remains disabled until async work finishes.
 * @property cooldownMs Optional cooldown window between accepted submissions.
 * @property timeoutMs Optional timeout used by input-request flows.
 * @property showAbort Whether input-request flows should expose an abort action.
 * @property allowFileUpload Whether the optional upload button is shown beside the shared input.
 */
export interface InputBarBehaviorConfig {
  readonly disabled?: boolean | undefined;
  readonly disabledPlaceholder?: string | undefined;
  readonly shouldWaitForTurn?: boolean | undefined;
  readonly cooldownMs?: number | undefined;
  readonly timeoutMs?: number | undefined;
  readonly showAbort?: boolean | undefined;
  readonly allowFileUpload?: boolean | undefined;
}

/**
 * Represents a single chat message.
 *
 * @property id Optional id used when seeding messages into the chat.
 * @property type Which side of the conversation the message belongs to.
 * @property parts Structured content shown in the chat transcript.
 * @property rawContent Raw value preserved for follow-up logic such as validation.
 * @property timestamp Optional timestamp to use instead of the current time.
 * @property isLoading Marks the message as a loading placeholder.
 * @property loadingLabel Optional label announced while a loading message is shown.
 * @property userResponseCallback Runs when the next user response should be handled by this message.
 * @property buttons Optional actions shown below the message bubble.
 */
export interface InputMessage {
  readonly id?: number;
  readonly type: MessageType;
  readonly parts: readonly MessagePart[];
  readonly rawContent?: string;
  readonly timestamp?: Date;
  readonly isLoading?: boolean;
  readonly loadingLabel?: string;
  readonly userResponseCallback?: (submission?: InputSubmission) => void;
  readonly buttons?: readonly MessageButton[];
}

/**
 * Normalized message shape stored in chat state after defaults are applied.
 *
 * @property rawContent Raw value preserved for follow-up logic such as validation.
 * @property timestamp Creation time assigned to the stored message.
 * @property id Stable id assigned by the chat store.
 */
export interface Message extends Omit<
  InputMessage,
  'rawContent' | 'timestamp' | 'id'
> {
  readonly rawContent: string;
  readonly timestamp: Date;
  readonly id: number;
}

/**
 * Props for the Chat component.
 *
 * @property initialMessages Optional messages shown when the chat first renders.
 * @property allowFreeTextInput When true, keeps the shared input enabled outside input-request flows.
 * @property globals Optional Chat-level defaults applied to helper flows such as request-input buttons.
 * @property theme Optional theme configuration for the chat UI.
 */
export interface ChatProps {
  readonly initialMessages?: readonly InputMessage[];
  readonly allowFreeTextInput?: boolean | undefined;
  readonly globals?: ChatGlobals | undefined;
  readonly theme?: ChatTheme;
}

/**
 * Props for the Chat component with flexible theme input.
 * Allows theme to be a string ('light' | 'dark'), a ChatTheme object, or undefined.
 *
 * @property theme Optional preset or full theme object used to style the chat UI.
 */
export type ChatPropsWithFlexibleTheme = Omit<ChatProps, 'theme'> & {
  readonly theme?: 'light' | 'dark' | ChatTheme | undefined;
};

/**
 * Creates a text part.
 *
 * @param text Text shown in the transcript.
 */
export function createTextPart(text: string): TextMessagePart {
  return {
    type: 'text',
    text,
    format: 'plain',
  };
}

/**
 * Creates a markdown text part.
 *
 * @param text Markdown shown in the transcript.
 * @param markdownOptions Optional markdown-only rendering settings.
 */
export function createMarkdownTextPart(
  text: string,
  markdownOptions?: MarkdownTextPartOptions
): TextMessagePart {
  return {
    type: 'text',
    text,
    format: 'markdown',
    markdownOptions,
  };
}

/**
 * Creates an inline image part.
 *
 * @param url Image source URL.
 * @param options Optional image metadata.
 */
export function createImagePart(
  url: string,
  options: {
    alt?: string | undefined;
    fileName?: string | undefined;
    mimeType?: string | undefined;
    maxWidthPx?: number | undefined;
    maxHeightPx?: number | undefined;
    sizeBytes?: number | undefined;
  } = {}
): ImageMessagePart {
  return {
    type: 'image',
    url,
    ...options,
  };
}

/**
 * Creates a downloadable file part.
 *
 * @param url File download URL.
 * @param options Optional file metadata.
 */
export function createFilePart(
  url: string,
  options: {
    fileName?: string | undefined;
    mimeType?: string | undefined;
    sizeBytes?: number | undefined;
  } = {}
): FileMessagePart {
  return {
    type: 'file',
    url,
    ...options,
  };
}
