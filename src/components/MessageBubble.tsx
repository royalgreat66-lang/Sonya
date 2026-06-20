import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isPlayingVoice?: boolean;
  isVoiceLoading?: boolean;
  onPlayVoice?: () => void;
  onStopVoice?: () => void;
  geminiKeyConfigured?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  isPlayingVoice = false,
  isVoiceLoading = false,
  onPlayVoice,
  onStopVoice,
  geminiKeyConfigured = true,
}) => {
  const isSonya = message.role === 'assistant';
  const displayTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Simple auto-LTR/RTL check based on first letter
  const isArabicText = (text: string) => {
    const arabicPartExp = /[\u0600-\u06FF]/;
    return arabicPartExp.test(text.substring(0, 50));
  };

  const isRtl = isArabicText(message.content);

  return (
    <div
      className={`flex gap-3.5 max-w-[85%] md:max-w-[75%] ${
        isSonya ? 'self-start flex-row' : 'self-end flex-row-reverse'
      } animate-fade-in`}
      id={`msg-bubble-wrapper-${message.id || 'streaming'}`}
    >
      {/* Avatar Node */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md border flex-shrink-0 select-none ${
          isSonya
            ? 'bg-gradient-to-tr from-violet-700 to-indigo-900 border-violet-500/30 text-[#e2d9ff]'
            : 'bg-zinc-800 border-zinc-700 text-[#888]'
        }`}
        id={`avatar-${isSonya ? 'sonya' : 'user'}`}
      >
        {isSonya ? 'S' : 'U'}
      </div>

      {/* Bubble, Timestamp, and Voice Trigger Container */}
      <div className="space-y-1">
        {/* Name Header for Sonya */}
        {isSonya && (
          <p className="text-[11px] font-extrabold tracking-wide uppercase text-violet-400 pl-0.5">
            Sonya
          </p>
        )}

        {/* Message Content Container */}
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`rounded-2xl px-4 py-3 border-[0.5px] leading-relaxed text-[13.5px] whitespace-pre-wrap break-words ${
            isSonya
              ? 'bg-violet-950/10 border-violet-500/20 text-[#e2d9ff]'
              : 'bg-white/[0.04] border-white/10 text-zinc-100 rounded-tr-none'
          } ${isRtl ? 'font-sans' : 'font-sans'}`}
          id={`content-box-${message.id || 'streaming'}`}
        >
          {message.content}
        </div>

        {/* Sub-bubble Meta details */}
        <div className={`flex items-center gap-2.5 text-[10px] text-zinc-500/95 pl-1 pr-1 ${isSonya ? 'justify-start' : 'justify-end'}`}>
          <span className="font-mono">{displayTime}</span>

          {isSonya && geminiKeyConfigured && (
            <>
              <span className="text-zinc-700">|</span>
              {isVoiceLoading ? (
                <div className="flex items-center gap-1.5 text-violet-400 select-none">
                  <Loader2 size={11} className="animate-spin" />
                  <span className="text-[9px] font-medium uppercase font-mono">Synthesizing...</span>
                </div>
              ) : isPlayingVoice ? (
                <button
                  onClick={onStopVoice}
                  className="flex items-center gap-1 text-violet-400 hover:text-red-400 font-bold uppercase tracking-tight transition-colors"
                  title="Stop voice output"
                  id={`voice-stop-btn-${message.id}`}
                >
                  <VolumeX size={12} className="animate-pulse" />
                  <span className="text-[9px] font-mono">Stop</span>
                </button>
              ) : (
                <button
                  onClick={onPlayVoice}
                  className="flex items-center gap-1 text-zinc-500 hover:text-[#8b5cf6] transition-colors"
                  title="Speak message aloud"
                  id={`voice-play-btn-${message.id}`}
                >
                  <Volume2 size={12} />
                  <span className="text-[9px]">Speak</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default MessageBubble;
