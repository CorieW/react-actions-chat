export type MessageType = 'user' | 'agent';

/**
 * Represents a single chat message.
 *
 * @property id Unique identifier for the message.
 * @property type Indicates whether the message is from the 'user' or 'agent'.
 * @property content The textual content of the message.
 * @property timestamp The date and time the message was created.
 * @property userResponseCallback Optional callback function invoked when a user response is received right after this message.
 */
export interface Message {
  readonly id: number;
  readonly type: MessageType;
  readonly content: string;
  readonly timestamp: Date;
  readonly userResponseCallback?: () => void;
}

/**
 * Props for the Chat component.
 *
 * @property initialMessages Optional array of messages to initialize the chat with.
 */
export interface ChatProps {
  readonly initialMessages?: readonly Message[];
}