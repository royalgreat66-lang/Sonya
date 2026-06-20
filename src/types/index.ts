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
  content: string;
  createdAt: Date;
}

export interface AppSettings {
  openRouterKey: string;
  geminiKey: string;
  autoVoiceOutput: boolean;
  selectedModel: string;
}
