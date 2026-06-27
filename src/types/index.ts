export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface Conversation {
  id?: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id?: number;
  conversationId: number;
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
  createdAt: Date;
}

export interface AppSettings {
  openRouterKey: string;
  geminiKey: string;
  autoVoiceOutput: boolean;
  selectedModel: string;
}