import { useState, useEffect, useCallback, useRef } from 'react';
import db from '../lib/db';
import { Conversation, Message } from '../types';
import { streamChatCompletion } from '../lib/openrouter';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentConvIdRef = useRef<number | null>(null);
  const streamingMessageRef = useRef<string | null>(null);
  const originalMessagesRef = useRef<Message[]>([]);

  // Load all conversations sorted by latest updated
  const loadConversations = useCallback(async () => {
    try {
      const list = await db.conversations.toArray();
      // Sort newest updatedAt first
      const sorted = list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setConversations(sorted);
      return sorted;
    } catch (e) {
      console.error('Failed to load conversations:', e);
      return [];
    }
  }, []);

  // Load messages for the given active conversation ID
  const loadMessages = useCallback(async (convId: number) => {
    try {
      const msgs = await db.messages.where('conversationId').equals(convId).sortBy('createdAt');
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, []);

  // Handle auto-opening most recent conversation on initial launch
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const list = await loadConversations();
      if (list.length > 0) {
        const latestId = list[0].id!;
        setActiveConversationId(latestId);
        await loadMessages(latestId);
      }
      setIsLoading(false);
    }
    init();
  }, [loadConversations, loadMessages]);

  // Select a conversation and load its messages
  const selectConversation = async (id: number) => {
    setIsLoading(true);
    setSendError(null);
    setStreamingMessage(null);
    setIsStreaming(false);
    setActiveConversationId(id);
    await loadMessages(id);
    setIsLoading(false);
  };

  // Start a new conversation and open it immediately
  const startNewConversation = async (): Promise<number> => {
    setSendError(null);
    setStreamingMessage(null);
    setIsStreaming(false);
    
    const newConv: Conversation = {
      title: 'New conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newId = await db.conversations.add(newConv);
    setActiveConversationId(newId);
    setMessages([]);
    await loadConversations();
    return newId;
  };

  // Delete a conversation and purge respective message entities
  const deleteConversation = async (id: number) => {
    await db.conversations.delete(id);
    await db.messages.where('conversationId').equals(id).delete();
    
    const list = await loadConversations();
    if (activeConversationId === id) {
      if (list.length > 0) {
        // Fall back to most recent
        const nextId = list[0].id!;
        setActiveConversationId(nextId);
        await loadMessages(nextId);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    } else {
      await loadConversations();
    }
  };

  // Rename conversation inline or via topbar actions
  const renameConversation = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    await db.conversations.update(id, {
      title: newTitle.trim(),
      updatedAt: new Date()
    });
    await loadConversations();
  };

  // Main core message dispatch handler
  const sendMessage = async (
    content: string,
    openRouterKey: string,
    model: string,
    provider: string,
    onSpeechPlaybackRequest?: (text: string) => void
  ) => {
    if (!content.trim()) return;
    setSendError(null);

    let currentConvId = activeConversationId;
    
    // Auto-create list if sending first message on empty welcome screen
    if (!currentConvId) {
      currentConvId = await startNewConversation();
    }

    const userMsg: Message = {
      conversationId: currentConvId,
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    // Save state update for user message immediately in the UI
    const originalMessages = [...messages];
    const updatedMsgs = [...originalMessages, userMsg];
    setMessages(updatedMsgs);

    // 1. Save User Message to DB
    await db.messages.add(userMsg);

    // 2. Prepare history and kickoff streaming
    const apiKey = provider === 'groq' ? (localStorage.getItem('groq_api_key') || '') : openRouterKey;
    setIsStreaming(true);
    setStreamingMessage('');
    streamingMessageRef.current = '';
    currentConvIdRef.current = currentConvId;
    originalMessagesRef.current = originalMessages;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    await streamChatCompletion(
      apiKey,
      provider,
      model,
      updatedMsgs,
      signal,
      (accumulatedText) => {
        setStreamingMessage(accumulatedText);
        streamingMessageRef.current = accumulatedText;
      },
      async (fullText) => {
        setIsStreaming(false);
        setStreamingMessage(null);

        // Save Assistant Completed Message
        const assistantMsg: Message = {
          conversationId: currentConvId!,
          role: 'assistant',
          content: fullText,
          createdAt: new Date(),
        };
        await db.messages.add(assistantMsg);

        // Auto-Generate title after first user action if title was default
        const isFirstExchange = originalMessages.length === 0;
        if (isFirstExchange) {
          // Extract first 4-5 words of first user message
          const words = content.trim().split(/\s+/).slice(0, 5);
          const autoTitle = words.join(' ') + (words.length >= 5 ? ' ' : '');
          await db.conversations.update(currentConvId!, {
            title: autoTitle || 'Conversation',
            updatedAt: new Date(),
          });
        } else {
          // just update conversation recency
          await db.conversations.update(currentConvId!, {
            updatedAt: new Date(),
          });
        }

        // Reload data
        await loadConversations();
        await loadMessages(currentConvId!);

        // Trigger TTS callback
        if (onSpeechPlaybackRequest) {
          onSpeechPlaybackRequest(fullText);
        }
      },
      (err) => {
        setIsStreaming(false);
        setStreamingMessage(null);
        setSendError(err.message || 'Connection failed.');
        console.error(err);
      },
    );
  };

  const editAndResend = async (messageId: number, newContent: string) => {
    const targetMessage = messages.find(msg => msg.id === messageId);
    if (!targetMessage || !activeConversationId) return;

    const targetTime = targetMessage.createdAt;

    // Build the history array locally: messages before target + the new edited user message
    const historyBeforeTarget = messages.filter(msg => msg.createdAt < targetTime);
    const editedUserMsg: Message = {
      conversationId: activeConversationId,
      role: 'user',
      content: newContent,
      createdAt: new Date(),
    };
    const updatedMsgs = [...historyBeforeTarget, editedUserMsg];

    // Delete all messages from that point onward in the current conversation
    await db.messages.where('conversationId').equals(activeConversationId)
      .and(msg => msg.createdAt >= targetTime)
      .delete();

    // Update state to only keep messages before the target
    setMessages(updatedMsgs);

    // Save the edited message as a new user message
    await db.messages.add(editedUserMsg);

    // Re-read provider, key, model from localStorage (they're always in sync)
    const apiKey = localStorage.getItem('sonya_openrouter_key') || '';
    const model = localStorage.getItem('sonya_model') || '';
    const provider = localStorage.getItem('sonya_provider') || 'openrouter';
    const effectiveApiKey = provider === 'groq' ? (localStorage.getItem('groq_api_key') || '') : apiKey;

    setSendError(null);
    setIsStreaming(true);
    setStreamingMessage('');
    streamingMessageRef.current = '';
    currentConvIdRef.current = activeConversationId;
    originalMessagesRef.current = historyBeforeTarget;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    await streamChatCompletion(
      effectiveApiKey,
      provider,
      model,
      updatedMsgs,
      signal,
      (accumulatedText) => {
        setStreamingMessage(accumulatedText);
        streamingMessageRef.current = accumulatedText;
      },
      async (fullText) => {
        setIsStreaming(false);
        setStreamingMessage(null);

        // Save Assistant Completed Message
        const assistantMsg: Message = {
          conversationId: activeConversationId,
          role: 'assistant',
          content: fullText,
          createdAt: new Date(),
        };
        await db.messages.add(assistantMsg);

        // just update conversation recency
        await db.conversations.update(activeConversationId, {
          updatedAt: new Date(),
        });

        // Reload data
        await loadConversations();
        await loadMessages(activeConversationId);
      },
      (err) => {
        setIsStreaming(false);
        setStreamingMessage(null);
        setSendError(err.message || 'Connection failed.');
        console.error(err);
      },
    );
  };

  const cancelStreaming = async () => {
    abortControllerRef.current?.abort();

    const partialContent = streamingMessageRef.current;
    if (partialContent && currentConvIdRef.current) {
      const partialMsg: Message = {
        conversationId: currentConvIdRef.current,
        role: 'assistant',
        content: partialContent,
        createdAt: new Date(),
      };
      await db.messages.add(partialMsg);

      const updatedMessages = [...originalMessagesRef.current, partialMsg];
      setMessages(updatedMessages);

      await db.conversations.update(currentConvIdRef.current, {
        updatedAt: new Date(),
      });
      await loadConversations();
    }

    setIsStreaming(false);
    setStreamingMessage(null);
    streamingMessageRef.current = null;
  };

  return {
    conversations,
    messages,
    activeConversationId,
    isLoading,
    isStreaming,
    streamingMessage,
    sendError,
    selectConversation,
    startNewConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    cancelStreaming,
    editAndResend,
  };
}
