import { Message } from '@progress/kendo-react-conversational-ui';

export interface ChatConversation {
  id: string;
  title: string;
  contextChallengeId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
}

export interface AIFunction {
  name: string;
  parameters: Record<string, unknown>;
}

export interface AIMessageData {
  functionCalls?: AIFunction[];
}