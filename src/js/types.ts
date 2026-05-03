import type {
  InputFileValidator,
  InputSelectOption,
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
  /**
   * Stable identifier for this value.
   */
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
  /**
   * Whether markdown code blocks use syntax highlighting.
   */
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
  /**
   * Discriminant or input type for this value.
   */
  readonly type: 'text';
  /**
   * Text content carried by this value.
   */
  readonly text: string;
  /**
   * Formatting mode used when rendering the text part.
   */
  readonly format?: TextMessageFormat | undefined;
  /**
   * Markdown rendering options for the text part.
   */
  readonly markdownOptions?: MarkdownTextPartOptions | undefined;
}

/**
 * Non-text file metadata shared by uploaded file and image parts.
 */
interface BaseAssetMessagePart extends BaseMessagePart {
  /**
   * Display filename for the file or image asset.
   */
  readonly fileName?: string | undefined;
  /**
   * MIME type for the file or image asset.
   */
  readonly mimeType?: string | undefined;
  /**
   * File size in bytes.
   */
  readonly sizeBytes?: number | undefined;
  /**
   * URL for the file or image asset.
   */
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
  /**
   * Discriminant or input type for this value.
   */
  readonly type: 'image';
  /**
   * Alternative text used when rendering the image part.
   */
  readonly alt?: string | undefined;
  /**
   * Maximum rendered width for the image in pixels.
   */
  readonly maxWidthPx?: number | undefined;
  /**
   * Maximum rendered height for the image in pixels.
   */
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
  /**
   * Discriminant or input type for this value.
   */
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
  /**
   * Primary color token used by the rendered UI.
   */
  readonly primaryColor?: string;
  /**
   * Secondary color token used by the rendered UI.
   */
  readonly secondaryColor?: string;
  /**
   * Background color token used by the rendered UI.
   */
  readonly backgroundColor?: string;
  /**
   * Default text color used by message and control surfaces.
   */
  readonly textColor?: string;
  /**
   * Border color used by chat UI surfaces.
   */
  readonly borderColor?: string;
  /**
   * Background color used by the shared input.
   */
  readonly inputBackgroundColor?: string;
  /**
   * Text color used inside the shared input.
   */
  readonly inputTextColor?: string;
  /**
   * Background color used by primary buttons.
   */
  readonly buttonColor?: string;
  /**
   * Text color used by primary buttons.
   */
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
  /**
   * Visible label shown for this option or button.
   */
  readonly label: string;
  /**
   * Callback invoked when click.
   */
  readonly onClick?: () => void | undefined;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: MessageButtonVariant | undefined;
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string | undefined;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: React.CSSProperties | undefined;
  /**
   * Whether the visible button prevents free-text input until it is cleared.
   */
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
  /**
   * Message part rendered by this component.
   */
  readonly part: TPart;
  /**
   * Message object handled by this contract.
   */
  readonly message: Message;
  /**
   * Theme tokens used to style the rendered UI.
   */
  readonly theme: ChatTheme;
}

/**
 * Contract for rendering a message part.
 *
 * @param props - Props passed to the renderer.
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
 * @property options Options shown when type is select.
 */
export interface InputBarModeConfig {
  /**
   * Discriminant or input type for this value.
   */
  readonly type: InputType;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: string | undefined;
  /**
   * Descriptive text shown to users or sent to a provider.
   */
  readonly description?: string | undefined;
  /**
   * Options available to the select input or operation.
   */
  readonly options?: readonly InputSelectOption[] | undefined;
}

/**
 * Public validation configuration for the shared input bar.
 *
 * @property fileValidator Optional validator applied when files are attached.
 * @property validator Optional validator applied after the user submits.
 * @property submitGuard Optional guard used to block submission before a message is added.
 */
export interface InputBarValidationConfig {
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: InputFileValidator | null | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | null | undefined;
  /**
   * Guard that can block an input submission.
   */
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
  /**
   * Whether the option or input control is disabled.
   */
  readonly disabled?: boolean | undefined;
  /**
   * Placeholder shown while the input is disabled.
   */
  readonly disabledPlaceholder?: string | undefined;
  /**
   * Whether submissions wait for the current assistant turn to finish.
   */
  readonly shouldWaitForTurn?: boolean | undefined;
  /**
   * Cooldown duration in milliseconds before another submission is allowed.
   */
  readonly cooldownMs?: number | undefined;
  /**
   * Timeout in milliseconds before a request-input flow expires.
   */
  readonly timeoutMs?: number | undefined;
  /**
   * Whether the abort action is shown while collecting input.
   */
  readonly showAbort?: boolean | undefined;
  /**
   * Whether file uploads are allowed for the input.
   */
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
  /**
   * Stable identifier for this value.
   */
  readonly id?: number;
  /**
   * Discriminant or input type for this value.
   */
  readonly type: MessageType;
  /**
   * Structured message parts rendered for the message.
   */
  readonly parts: readonly MessagePart[];
  /**
   * Original unformatted content for the input message.
   */
  readonly rawContent?: string;
  /**
   * Timestamp associated with the input message.
   */
  readonly timestamp?: Date;
  /**
   * Whether loading is true.
   */
  readonly isLoading?: boolean;
  /**
   * Accessible label shown for loading messages.
   */
  readonly loadingLabel?: string;
  /**
   * Handles the next user response for a message.
   *
   * @param submission - Full input submission, including text and files.
   */
  readonly userResponseCallback?: (submission?: InputSubmission) => void;
  /**
   * Buttons rendered, stored, or customized by this contract.
   */
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
  /**
   * Original unformatted content for the stored message.
   */
  readonly rawContent: string;
  /**
   * Timestamp associated with the stored message.
   */
  readonly timestamp: Date;
  /**
   * Stable identifier for this value.
   */
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
  /**
   * Messages used to seed the chat transcript.
   */
  readonly initialMessages?: readonly InputMessage[];
  /**
   * Whether users can submit free-text messages without a request-input flow.
   */
  readonly allowFreeTextInput?: boolean | undefined;
  /**
   * Global chat defaults applied by the component.
   */
  readonly globals?: ChatGlobals | undefined;
  /**
   * Theme tokens used to style the rendered UI.
   */
  readonly theme?: ChatTheme;
}

/**
 * Props for the Chat component with flexible theme input.
 * Allows theme to be a string ('light' | 'dark'), a ChatTheme object, or undefined.
 *
 * @property theme Optional preset or full theme object used to style the chat UI.
 */
export type ChatPropsWithFlexibleTheme = Omit<ChatProps, 'theme'> & {
  /**
   * Theme tokens used to style the rendered UI.
   */
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
    /**
     * Alternative text used when rendering the image part.
     */
    alt?: string | undefined;
    /**
     * Display filename for the file or image asset.
     */
    fileName?: string | undefined;
    /**
     * MIME type for the file or image asset.
     */
    mimeType?: string | undefined;
    /**
     * Maximum rendered width for the image in pixels.
     */
    maxWidthPx?: number | undefined;
    /**
     * Maximum rendered height for the image in pixels.
     */
    maxHeightPx?: number | undefined;
    /**
     * File size in bytes.
     */
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
    /**
     * Display filename for the file or image asset.
     */
    fileName?: string | undefined;
    /**
     * MIME type for the file or image asset.
     */
    mimeType?: string | undefined;
    /**
     * File size in bytes.
     */
    sizeBytes?: number | undefined;
  } = {}
): FileMessagePart {
  return {
    type: 'file',
    url,
    ...options,
  };
}
