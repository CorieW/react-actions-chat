export type MessageType = 'self' | 'other';

/**
 * Theme configuration for the chat component.
 *
 * @property primaryColor Color for self messages and primary elements
 * @property secondaryColor Color for other messages and secondary elements
 * @property backgroundColor Background color of the chat container
 * @property textColor Primary text color
 * @property borderColor Color for borders and dividers
 * @property inputBackgroundColor Background color for the input field
 * @property inputTextColor Text color for the input field
 * @property buttonColor Background color for buttons
 * @property buttonTextColor Text color for buttons
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
 * @property label The text displayed on the button.
 * @property onClick Callback function executed when the button is clicked.
 * @property variant Optional variant style for the button. Defaults to 'default'.
 * @property className Optional custom CSS class names to apply to the button.
 * @property style Optional custom inline styles to apply to the button. These will override variant styles.
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
 * @property id Unique identifier for the message.
 * @property type Indicates whether the message is from 'self' or 'other'.
 * @property content The textual content of the message to be displayed to the user.
 * @property rawContent The raw content of the message, used for processing and validation.
 * @property timestamp The date and time the message was created.
 * @property userResponseCallback Optional callback function invoked when a self response is received right after this message.
 * @property buttons Optional array of buttons to display below the message.
 */
export interface InputMessage {
  readonly id?: number;
  readonly type: MessageType;
  readonly content: string;
  readonly rawContent?: string;
  readonly timestamp?: Date;
  readonly userResponseCallback?: () => void;
  readonly buttons?: readonly MessageButton[];
}

export interface Message
  extends Omit<InputMessage, 'rawContent' | 'timestamp' | 'id'> {
  readonly rawContent: string;
  readonly timestamp: Date;
  readonly id: number;
}

/**
 * Props for the Chat component.
 *
 * @property initialMessages Optional array of messages to initialize the chat with.
 * @property theme Optional theme configuration to customize the chat appearance.
 */
export interface ChatProps {
  readonly initialMessages?: readonly InputMessage[];
  readonly theme?: ChatTheme;
}

/**
 * Props for the Chat component with flexible theme input.
 * Allows theme to be a string ('light' | 'dark'), a ChatTheme object, or undefined.
 */
export type ChatPropsWithFlexibleTheme = Omit<ChatProps, 'theme'> & {
  readonly theme?: 'light' | 'dark' | ChatTheme | undefined;
};
