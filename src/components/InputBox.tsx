import React, { useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, Globe, AlertCircle } from 'lucide-react';

interface InputBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disableSend: boolean;
  
  // Voice integration props
  isListening: boolean;
  speechSupported: boolean;
  speechLang: 'en-US' | 'ar-EG';
  onToggleListening: () => void;
  onChangeSpeechLang: (lang: 'en-US' | 'ar-EG') => void;
}

export function InputBox({
  value,
  onChange,
  onSend,
  disableSend,
  isListening,
  speechSupported,
  speechLang,
  onToggleListening,
  onChangeSpeechLang,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

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
        onSend();
      }
    }
  };

  const toggleLang = () => {
    onChangeSpeechLang(speechLang === 'en-US' ? 'ar-EG' : 'en-US');
  };

  return (
    <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2" id="input-tray-wrapper">
      {isListening && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 rounded-md self-center animate-pulse" id="mic-status-bubble">
          <Mic size={12} className="animate-bounce" />
          <span>Active listening ({speechLang === 'en-US' ? 'English' : 'Arabic'})... Speak clearly now</span>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto flex items-end gap-3 bg-[#0a0814]/80 border border-[#8b5cf6]/20 backdrop-blur-md rounded-2xl p-3 shadow-2xl shadow-violet-900/10 relative z-10" id="input-box-container">
        {/* Paperclip upload indicator */}
        <button
          type="button"
          onClick={() => alert('Attachments can be added here. (UI design only for this build)')}
          className="p-2.5 text-zinc-500 hover:text-violet-300 transition-colors hover:bg-white/5 rounded-lg flex-shrink-0 cursor-pointer"
          title="Attach files (UI Mockup Only)"
          id="btn-paperclip-mockup"
        >
          <Paperclip size={18} />
        </button>

        {/* Text Entry Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Say something to Sonya..."
          rows={1}
          maxLength={4000}
          className="flex-1 max-h-[150px] overflow-y-auto bg-transparent border-0 outline-none text-[#e2d9ff] text-[14px] leading-relaxed py-1.5 px-1 placeholder-zinc-600 resize-none font-sans scrollbar-thin scrollbar-thumb-zinc-800"
          id="textarea-user-input"
        />

        {/* Input Controls Bar - Speech API and Send Buttons */}
        <div className="flex items-center gap-1.5 h-10 pr-0.5 flex-shrink-0 self-end">
          {speechSupported ? (
            <div className="flex items-center gap-1 bg-[#121020] border-[0.5px] border-violet-500/10 p-1.5 rounded-lg select-container" id="speech-control-hud">
              {/* Language toggler badge */}
              <button
                type="button"
                onClick={toggleLang}
                className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-extrabold bg-[#221040] text-violet-200 border border-[#8b5cf6]/20 rounded-md hover:bg-[#8b5cf6]/20 transition-colors uppercase cursor-pointer"
                title={`Change speech dictation language (Current: ${speechLang === 'en-US' ? 'English' : 'Arabic'})`}
                id="btn-lang-speech-dictation"
              >
                {speechLang === 'en-US' ? 'EN' : 'AR'}
              </button>

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
              <span className="hidden md:inline font-mono">No Mic Support</span>
            </div>
          )}

          {/* Send submission button */}
          <button
            type="button"
            onClick={onSend}
            disabled={disableSend || !value.trim()}
            className={`p-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center transition-all cursor-pointer ${
              disableSend || !value.trim()
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
            }`}
            title="Send Message"
            id="btn-send-message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
      
      {/* Footer copyright label */}
      <div className="w-full text-center py-1 flex items-center justify-center">
        <span className="text-[10px] text-zinc-600 mt-2 uppercase tracking-[0.2em] font-semibold font-mono select-none">
          Private Instance • Encrypted Locally • AI 2.0
        </span>
      </div>
    </div>
  );
}
export default InputBox;
