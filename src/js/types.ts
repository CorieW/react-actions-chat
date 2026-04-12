/**
 * Indicates whether a message is from the local user or the assistant side.
 */
export type MessageType = 'self' | 'other';

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
 */
export interface MessageButton {
  readonly label: string;
  readonly onClick?: () => void | undefined;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
}

/**
 * Represents a single chat message.
 *
 * @property id Optional id used when seeding messages into the chat.
 * @property type Which side of the conversation the message belongs to.
 * @property content Text shown to the user in the chat transcript.
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
  readonly content: string;
  readonly rawContent?: string;
  readonly timestamp?: Date;
  readonly isLoading?: boolean;
  readonly loadingLabel?: string;
  readonly userResponseCallback?: () => void;
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
 * @property theme Optional theme configuration for the chat UI.
 */
export interface ChatProps {
  readonly initialMessages?: readonly InputMessage[];
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
