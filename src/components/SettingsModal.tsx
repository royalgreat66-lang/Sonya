import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Key, ShieldCheck, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openRouterKey: string;
  geminiKey: string;
  autoVoiceOutput: boolean;
  onSave: (settings: { openRouterKey: string; geminiKey: string; autoVoiceOutput: boolean }) => void;
  forceSetup?: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  openRouterKey,
  geminiKey,
  autoVoiceOutput,
  onSave,
  forceSetup = false,
}: SettingsModalProps) {
  const [orKey, setOrKey] = useState(openRouterKey);
  const [gemKey, setGemKey] = useState(geminiKey);
  const [voiceOn, setVoiceOn] = useState(autoVoiceOutput);

  const [showOr, setShowOr] = useState(false);
  const [showGem, setShowGem] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setOrKey(openRouterKey);
      setGemKey(geminiKey);
      setVoiceOn(autoVoiceOutput);
      setSaveSuccess(false);
    }
  }, [isOpen, openRouterKey, geminiKey, autoVoiceOutput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      openRouterKey: orKey.trim(),
      geminiKey: gemKey.trim(),
      autoVoiceOutput: voiceOn,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (!forceSetup) onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="settings-modal-wrapper">
      {/* Background Dim Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => {
          if (!forceSetup) onClose();
        }}
        id="settings-modal-backdrop"
      />

      {/* Settings Dialog Box */}
      <div
        className="relative w-full max-w-md bg-[#0a0812]/95 border border-violet-500/20 rounded-xl p-6 shadow-2xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
        id="settings-dialog-card"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Key className="text-[#8b5cf6]" size={18} />
            <span className="text-md font-bold text-[#e2d9ff]">
              {forceSetup ? 'Initial Credentials Setup' : 'Credentials & Voice'}
            </span>
          </div>
          {!forceSetup && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md"
              id="close-settings-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {forceSetup && (
          <div className="p-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#e2d9ff] text-xs leading-relaxed rounded-lg">
            <strong>Welcome to Sonya.</strong> As a client-only companion app, API keys are saved exclusively in your browser&apos;s localStorage. We never store them on any remote servers. Please insert your keys to begin speaking with Sonya.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="settings-form">
          {/* OpenRouter Key */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider flex items-center justify-between">
              <span>OpenRouter API Key *</span>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline hover:text-violet-300 normal-case font-normal text-[10px]"
              >
                Get Key
              </a>
            </label>
            <div className="relative flex items-center">
              <input
                type={showOr ? 'text' : 'password'}
                value={orKey}
                onChange={(e) => setOrKey(e.target.value)}
                required
                placeholder="sk-or-v1-..."
                className="w-full bg-zinc-950 border border-violet-500/10 text-[#e2d9ff] text-sm px-3.5 py-2.5 rounded-lg pr-10 outline-none focus:border-[#8b5cf6]/40 focus:ring-1 focus:ring-[#8b5cf6]/20 transition-all font-mono"
                id="input-openrouter-key"
              />
              <button
                type="button"
                onClick={() => setShowOr(!showOr)}
                className="absolute right-3.5 text-zinc-500 hover:text-[#e2d9ff] transition-colors"
                id="btn-toggle-or-visibility"
              >
                {showOr ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider flex items-center justify-between">
              <span>Gemini API Key (TTS Voice API) *</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline hover:text-violet-300 normal-case font-normal text-[10px]"
              >
                Get Key
              </a>
            </label>
            <div className="relative flex items-center">
              <input
                type={showGem ? 'text' : 'password'}
                value={gemKey}
                onChange={(e) => setGemKey(e.target.value)}
                required
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950 border border-violet-500/10 text-[#e2d9ff] text-sm px-3.5 py-2.5 rounded-lg pr-10 outline-none focus:border-[#8b5cf6]/40 focus:ring-1 focus:ring-[#8b5cf6]/20 transition-all font-mono"
                id="input-gemini-key"
              />
              <button
                type="button"
                onClick={() => setShowGem(!showGem)}
                className="absolute right-3.5 text-zinc-500 hover:text-[#e2d9ff] transition-colors"
                id="btn-toggle-gemini-visibility"
              >
                {showGem ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Voice Output Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-lg border border-violet-500/5">
            <div className="flex items-center gap-3">
              <Volume2 className="text-[#8b5cf6]" size={16} />
              <div>
                <p className="text-xs font-semibold text-[#e2d9ff]">Autoplay Voice Output</p>
                <p className="text-[10px] text-zinc-600">Play Sonya&apos;s audio replies immediately</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer" id="autoplay-toggle-wrapper">
              <input
                type="checkbox"
                checked={voiceOn}
                onChange={(e) => setVoiceOn(e.target.checked)}
                className="sr-only peer"
                id="chk-voice-output"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {/* Submit Action Block */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saveSuccess}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-violet-600/15 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:bg-emerald-600 disabled:cursor-not-allowed"
              id="btn-save-settings"
            >
              {saveSuccess ? (
                <>
                  <ShieldCheck size={16} className="animate-spin-once" />
                  <span>Config Saved Successfully</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default SettingsModal;
