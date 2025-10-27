export type MessageType = 'user' | 'agent';

export interface Message {
  readonly id: number;
  readonly type: MessageType;
  readonly content: string;
  readonly timestamp: Date;
}

export interface ChatProps {
  readonly initialMessages?: readonly Message[];
}

