import React, { useRef, useEffect, useState } from 'react';
import { Mic, Send, Globe, AlertCircle, Square, X, ImageIcon } from 'lucide-react';

interface InputBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (imageBase64?: string) => void;
  disableSend: boolean;
  
  // Voice integration props
  isListening: boolean;
  isStreaming: boolean;
  speechSupported: boolean;
  speechLang: 'en-US' | 'ar-EG';
  onToggleListening: () => void;
  onChangeSpeechLang: (lang: 'en-US' | 'ar-EG') => void;
  onCancelStreaming: () => void;

  // Keyboard state (managed by App.tsx)
  isKeyboardOpen: boolean;
}

export function InputBox({
  value,
  onChange,
  onSend,
  disableSend,
  isListening,
  isStreaming,
  speechSupported,
  onToggleListening,
  onChangeSpeechLang,
  onCancelStreaming,
  isKeyboardOpen,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  // Detect mobile devices (iOS/Android)
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Fix first-load textarea height alignment: wait for fonts to load, then recalculate
  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
    };
    // Use fonts.ready if available, fall back to a short timeout
    const ready = document.fonts?.ready;
    if (ready) {
      ready.then(adjustHeight).catch(() => setTimeout(adjustHeight, 100));
    } else {
      setTimeout(adjustHeight, 100);
    }
  }, []);

  // NOTE: visualViewport resize/scroll handling is consolidated in App.tsx
  // and passed down via the isKeyboardOpen prop. No duplicate listeners here.
  useEffect(() => {
    onChangeSpeechLang('en-US');
  }, [onChangeSpeechLang]);

  const handleTextareaFocus = () => {
    window.setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: 'end', inline: 'nearest' });
    }, 300);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disableSend && value.trim()) {
        onSend(attachedImage || undefined);
        setAttachedImage(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  return (
    <div className={`px-6 pt-6 ${isKeyboardOpen && isMobile ? "pb-[calc(0.5rem)]" : "pb-[calc(0.5rem+env(safe-area-inset-bottom))]"} pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2`} id="input-tray-wrapper">
      {isListening && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 rounded-md self-center animate-pulse" id="mic-status-bubble">
          <Mic size={12} className="animate-bounce" />
          <span>Active listening (English)... Speak clearly now</span>
        </div>
      )}

      {attachedImage && (
        <div className="max-w-3xl mx-auto w-full mb-2 relative inline-flex">
          <div className="relative rounded-xl overflow-hidden border border-violet-500/20 bg-[#0a0814]">
            <img
              src={attachedImage}
              alt="Attached"
              className="max-h-[120px] w-auto object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-zinc-300 hover:text-white transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto flex items-center gap-3 bg-[#0a0814]/80 border border-[#8b5cf6]/20 backdrop-blur-md rounded-2xl p-3 shadow-2xl shadow-violet-900/10 relative z-10" id="input-box-container">
        {/* Image attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 transition-colors rounded-lg flex-shrink-0 cursor-pointer ${
            attachedImage
              ? 'text-violet-400 bg-violet-500/10'
              : 'text-zinc-500 hover:text-violet-300 hover:bg-white/5'
          }`}
          title="Attach an image"
          id="btn-paperclip"
        >
          <ImageIcon size={18} />
        </button>

        {/* Text Entry Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onFocus={handleTextareaFocus}
          onKeyDown={handleKeyDown}
          placeholder="Say something to Sonya..."
          rows={1}
          maxLength={4000}
          className="flex-1 max-h-[150px] overflow-y-auto bg-transparent border-0 outline-none text-[#e2d9ff] text-[14px] leading-normal py-2 px-1 placeholder-zinc-600 resize-none font-sans scrollbar-thin scrollbar-thumb-zinc-800"
          id="textarea-user-input"
        />

        {/* Input Controls Bar - Speech API and Send Buttons */}
        <div className="flex items-center gap-1.5 h-10 pr-0.5 flex-shrink-0 self-end">
          {speechSupported ? (
            <div className="flex items-center gap-1 bg-[#121020] border-[0.5px] border-violet-500/10 p-1.5 rounded-lg select-container" id="speech-control-hud">
              <button
                type="button"
                onClick={onToggleListening}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 border border-red-500 text-white animate-pulse'
                    : 'text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10'
                }`}
                title="Dictate with Web Speech API"
                id="btn-mic-toggle"
              >
                <Mic size={14} />
              </button>
            </div>
          ) : (
            <div className="px-2 py-1 text-[10px] text-zinc-600 flex items-center gap-1 cursor-default opacity-50" title="Voice dictation not supported in this browser" id="dictation-unsupported-tag">
              <AlertCircle size={10} />
              <span className="hidden lg:inline font-mono">No Mic Support</span>
            </div>
          )}

          {/* Send submission button / Stop streaming button */}
          <button
            type="button"
            onClick={() => {
              if (isStreaming) {
                onCancelStreaming();
              } else {
                onSend(attachedImage || undefined);
                setAttachedImage(null);
              }
            }}
            disabled={!isStreaming && (disableSend || !value.trim())}
            className={`p-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center transition-all cursor-pointer ${
              !isStreaming && (disableSend || !value.trim())
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                : isStreaming
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
            }`}
            title={isStreaming ? 'Stop Streaming' : 'Send Message'}
            id="btn-send-message"
          >
            {isStreaming ? <Square size={15} /> : <Send size={15} />}
          </button>
        </div>
      </div>
      
    </div>
  );
}
export default InputBox;
