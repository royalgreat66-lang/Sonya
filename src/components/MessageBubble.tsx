import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isPlayingVoice?: boolean;
  isVoiceLoading?: boolean;
  onPlayVoice?: () => void;
  onStopVoice?: () => void;
  geminiKeyConfigured?: boolean;
  onEditMessage?: (messageId: number, newContent: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  isPlayingVoice = false,
  isVoiceLoading = false,
  onPlayVoice,
  onStopVoice,
  geminiKeyConfigured = true,
  onEditMessage,
}) => {
  const getTextContent = (content: string | any[]): string => {
    if (Array.isArray(content)) {
      const textPart = content.find(part => part.type === 'text');
      return textPart ? textPart.text : '';
    }
    return content;
  };

  const getImageContent = (content: string | any[]): string | null => {
    if (Array.isArray(content)) {
      const imgPart = content.find(part => part.type === 'image_url');
      return imgPart ? imgPart.image_url.url : null;
    }
    return null;
  };

  const textContent = getTextContent(message.content);
  const imageContent = getImageContent(message.content);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(textContent);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
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

  const isRtl = isArabicText(textContent);

  return (
    <div
      className={`flex gap-3.5 max-w-[85%] md:max-w-[75%] ${
        isSonya ? 'self-start flex-row' : 'self-end flex-row-reverse'
      } animate-fade-in`}
      id={`msg-bubble-wrapper-${message.id || 'streaming'}`}
    >
      {/* Avatar Node */}
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md border flex-shrink-0 select-none ${
          isSonya
            ? 'border-violet-500/30'
            : 'bg-zinc-800 border-zinc-700 text-[#888]'
        }`}
        id={`avatar-${isSonya ? 'sonya' : 'user'}`}
      >
        {isSonya ? <img src="/Sonya/sonya-avatar.png" className="w-full h-full rounded-full object-cover" /> : 'U'}
      </div>

      {/* Bubble, Timestamp, and Voice Trigger Container */}
      <div className="space-y-1">
        {/* Name Header for Sonya */}
        {isSonya && (
          <p className="text-[11px] font-extrabold tracking-wide uppercase text-violet-400 pl-0.5">
            Sonya
          </p>
        )}

        {/* Image thumbnail above text bubble */}
        {imageContent && (
          <div className={`${!isSonya ? 'flex justify-end' : ''}`}>
            <button
              type="button"
              onClick={() => setLightboxImage(imageContent)}
              className="inline-block p-0 border-0 bg-transparent cursor-pointer"
            >
              <img
                src={imageContent}
                alt="Attached image"
                className="max-h-[160px] w-auto rounded-xl object-contain border border-white/10 hover:opacity-90 transition-opacity"
              />
            </button>
          </div>
        )}

        {/* Lightbox overlay */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            <img
              src={lightboxImage}
              alt="Full size image"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Message Content Container */}
        <div className="group relative">
          {isEditing ? (
            <div className="space-y-2 w-[min(600px,90vw)]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[#0a0814] border border-[#8b5cf6]/40 text-[#e2d9ff] rounded-xl px-3 py-2 text-[13.5px] leading-relaxed resize-none focus:outline-none focus:border-violet-500 font-sans"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onEditMessage && message.id) {
                      onEditMessage(message.id as number, editContent);
                    }
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(textContent);
                  }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            textContent && (
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`rounded-2xl px-4 py-3 border-[0.5px] leading-relaxed text-[13.5px] whitespace-pre-wrap break-words ${
                  isSonya
                    ? 'bg-violet-950/10 border-violet-500/20 text-[#e2d9ff]'
                    : 'bg-white/[0.04] border-white/10 text-zinc-100 rounded-tr-none'
                } ${isRtl ? 'font-sans' : 'font-sans'}`}
                id={`content-box-${message.id || 'streaming'}`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span>{children}</span>
                  }}
                >
                  {textContent}
                </ReactMarkdown>
              </div>
            )
          )}

        </div>

        {/* Sub-bubble Meta details */}
        <div className={`flex items-center gap-2.5 text-[10px] text-zinc-500/95 pl-1 pr-1 ${isSonya ? 'justify-start' : 'justify-end'}`}>
          {!isSonya && onEditMessage && message.id && !isEditing && (
            <>
              <span
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(textContent);
                }}
                className="p-0.5 text-zinc-500 hover:text-violet-400 cursor-pointer transition-colors"
                title="Edit message"
              >
                <Pencil size={10} />
              </span>
              <span className="text-zinc-700">|</span>
            </>
          )}
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
