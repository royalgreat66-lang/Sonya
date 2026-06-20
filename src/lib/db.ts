import Dexie, { type Table } from 'dexie';
import { Conversation, Message } from '../types';

export class SonyaDatabase extends Dexie {
  conversations!: Table<Conversation, number>;
  messages!: Table<Message, number>;

  constructor() {
    super('SonyaDatabase');
    this.version(1).stores({
      conversations: '++id, title, createdAt, updatedAt',
      messages: '++id, conversationId, role, createdAt',
    });
  }
}

export const db = new SonyaDatabase();
export default db;
