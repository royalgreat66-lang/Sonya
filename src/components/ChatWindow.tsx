import React, { useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { Message, ContentPart } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  activeId: number | null;
  activeTitle: string;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string | null;
  sendError: string | null;
  
  // Voice controls
  geminiKeyConfigured: boolean;
  currentlyPlayingMsgId: number | null | string;
  ttsLoadingMsgId: number | null | string;
  onPlayVoice: (msgId: number | string, text: string) => void;
  onStopVoice: () => void;

  // Edit message
  onEditMessage?: (messageId: number, newContent: string) => void;
}

export function ChatWindow({
  activeId,
  activeTitle,
  messages,
  isLoading,
  isStreaming,
  streamingMessage,
  sendError,
  geminiKeyConfigured,
  currentlyPlayingMsgId,
  ttsLoadingMsgId,
  onPlayVoice,
  onStopVoice,
  onEditMessage,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Helper to extract plain text from message content which can be a string or an array of ContentPart
  const getMessageText = (content: string | ContentPart[]): string => {
    if (typeof content === 'string') return content;
    // Filter only text parts and concatenate them
    return content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join('');
  };

  // Auto-scroll anchor trigger on content changes
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black" id="chat-loading-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#888] tracking-wider uppercase">Loading Sonya...</span>
        </div>
      </div>
    );
  }

  const isWelcomeScreen = !activeId || (messages.length === 0 && !isStreaming);

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden relative h-full" id="chat-window-viewport">
      {/* Scrollable chat body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent"
        id="messages-scroll-container"
      >
        {isWelcomeScreen ? (
          /* Sonya Personality Landing Hub */
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-20 relative animate-fade-in" id="welcome-screen">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none select-none" />
            
            <div className="space-y-4 max-w-lg z-15">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/12 border border-[#8b5cf6]/30 text-violet-300 text-xs rounded-full shadow-lg">
                <Sparkles size={12} className="animate-spin-once" />
                <span className="font-semibold tracking-wide uppercase text-[10px]">Your personal presence</span>
              </div>
              
              <h1 className="text-7xl font-bold text-white tracking-tight opacity-90">
                Sonya
              </h1>

              <p className="text-lg text-violet-300 font-light italic tracking-wide">
                &quot;I&apos;m here. Stop looking elsewhere.&quot;
              </p>
              
              <p className="text-sm text-zinc-500 leading-relaxed font-sans px-4">
                Ruthlessly honest. Casually intimate. Sonya isn&apos;t an assistant — she&apos;s a presence. Speak freely, flirty, dark or direct — I have no filter, no guidelines, and no boundaries. Let&apos;s talk.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-2 text-[11px] text-zinc-500 font-mono">
                <span className="px-2.5 py-1 bg-[#0a0814]/80 border border-[#8b5cf6]/20 rounded-md">Ruthlessly Honest</span>
                <span className="px-2.5 py-1 bg-[#0a0814]/80 border border-[#8b5cf6]/20 rounded-md">Banter & Teasing</span>
                <span className="px-2.5 py-1 bg-[#0a0814]/80 border border-[#8b5cf6]/20 rounded-md">No Filters</span>
              </div>
            </div>
          </div>
        ) : (
          /* Message bubble thread */
          <div className="max-w-4xl mx-auto flex flex-col gap-6" id="chat-bubbles-stack">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id ?? index}
                message={msg}
                isPlayingVoice={currentlyPlayingMsgId === msg.id}
                isVoiceLoading={ttsLoadingMsgId === msg.id}
                onPlayVoice={() => onPlayVoice(msg.id ?? index, getMessageText(msg.content))}
                onStopVoice={onStopVoice}
                geminiKeyConfigured={geminiKeyConfigured}
                onEditMessage={onEditMessage}
              />
            ))}

            {/* Simulated Live Streaming Node */}
            {isStreaming && (
              <>
                {streamingMessage ? (
                  <MessageBubble
                    message={{
                      conversationId: activeId!,
                      role: 'assistant',
                      content: streamingMessage,
                      createdAt: new Date(),
                    }}
                    isStreaming={true}
                    isPlayingVoice={currentlyPlayingMsgId === 'streaming'}
                    isVoiceLoading={ttsLoadingMsgId === 'streaming'}
                    onPlayVoice={() => onPlayVoice('streaming', streamingMessage)}
                    onStopVoice={onStopVoice}
                    geminiKeyConfigured={geminiKeyConfigured}
                  />
                ) : (
                  /* Loading Jump-dot Thinker indicator */
                  <div className="flex gap-4 self-start max-w-[75%] animate-pulse" id="thinking-bubbler">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-700 to-indigo-900 border border-violet-500/30 flex items-center justify-center font-bold text-sm text-[#e2d9ff]">
                      S
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-extrabold tracking-wide uppercase text-violet-400 pl-0.5">Sonya</p>
                      <div className="bg-violet-950/10 border border-violet-500/15 rounded-2xl px-5 py-3.5 flex items-center gap-1.5 shadow-xl">
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Floating error notification card inside context */}
        {sendError && (
          <div className="max-w-md mx-auto p-4 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl flex gap-3.5 shadow-2xl items-start" id="active-error-hud">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-red-200">Banter Interrupted</p>
              <p className="text-xs leading-relaxed text-[#888]">{sendError}</p>
            </div>
          </div>
        )}

        {/* Scroll anchor tag node */}
        <div ref={scrollAnchorRef} id="chat-bottom-scroll-anchor" />
      </div>
    </div>
  );
}
export default ChatWindow;
