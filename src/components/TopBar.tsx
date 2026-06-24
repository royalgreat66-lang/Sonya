import React, { useState } from 'react';
import { Menu, Settings, Trash2, Edit, Loader2 } from 'lucide-react';
import { ModelSwitcher } from './ModelSwitcher';

interface TopBarProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  provider: string;
  onChangeProvider: (provider: string) => void;
  onOpenSettings: () => void;
  activeId: number | null;
  activeTitle: string;
  onRenameActive: (id: number, newTitle: string) => void;
  onDeleteActive: (id: number) => void;
}

export function TopBar({
  onToggleSidebar,
  selectedModel,
  onChangeModel,
  provider,
  onChangeProvider,
  onOpenSettings,
  activeId,
  activeTitle,
  onRenameActive,
  onDeleteActive,
}: TopBarProps) {
  const [isPromptRename, setIsPromptRename] = useState(false);
  const [providerSwitching, setProviderSwitching] = useState(false);
  const groqApiKey = localStorage.getItem('groq_api_key') || '';

  const handleTriggerRename = () => {
    if (!activeId) return;
    const current = activeTitle || 'New conversation';
    const repName = prompt('Enter a new conversation name:', current);
    if (repName && repName.trim() && repName.trim() !== current) {
      onRenameActive(activeId, repName.trim());
    }
  };

  const handleTriggerDelete = () => {
    if (!activeId) return;
    const confirmText = `Are you sure you want to delete this conversation permanently?`;
    if (confirm(confirmText)) {
      onDeleteActive(activeId);
    }
  };

  return (
    <header className="h-[60px] border-b border-[#8b5cf6]/10 bg-black/40 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30" id="top-bar-header">
      {/* Left controls panel - Menu drawer launcher & Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation drawer"
          id="btn-sidebar-drawer-toggle"
        >
          <Menu size={18} />
        </button>

        <ModelSwitcher
          selectedModel={selectedModel}
          onChange={onChangeModel}
          provider={provider}
          groqApiKey={groqApiKey}
        />
        <button
          onClick={() => {
            const next = provider === 'openrouter' ? 'groq' : 'openrouter';
            setProviderSwitching(true);
            onChangeProvider(next);
            setTimeout(() => setProviderSwitching(false), 500);
          }}
          disabled={providerSwitching}
          className="text-[11px] text-violet-400 hover:text-violet-300 border border-violet-500/20 px-2 py-1 rounded-md transition-colors disabled:opacity-60"
        >
          {providerSwitching ? (
            <Loader2 size={12} className="animate-spin text-violet-400" />
          ) : (
            provider === 'openrouter' ? 'OpenRouter' : 'Groq'
          )}
        </button>
      </div>

      {/* Center metadata tag */}
      <div className="hidden lg:block text-center max-w-[200px] truncate" id="top-bar-current-context">
        {activeId && (
          <span className="text-xs font-semibold text-[#888] tracking-tight">
            Chatting: <span className="text-[#e2d9ff]">{activeTitle}</span>
          </span>
        )}
      </div>

      {/* Right control utilities - Rename, delete conversation, launch settings portal */}
      <div className="flex items-center gap-2">
        {activeId && (
          <>
            <button
              onClick={handleTriggerRename}
              className="p-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
              title="Rename Current Conversation"
              id="top-bar-rename-trigger"
            >
              <Edit size={15} />
            </button>

            <button
              onClick={handleTriggerDelete}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Current Conversation"
              id="top-bar-delete-trigger"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}

        <div className="w-[0.5px] h-4 bg-white/10 mx-1" />

        <button
          onClick={onOpenSettings}
          className="p-2 gap-1 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-[#e2d9ff] hover:text-white rounded-lg transition-all text-xs font-medium flex items-center"
          title="Open API Credentials Management"
          id="top-bar-settings-trigger"
        >
          <Settings size={14} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}
export default TopBar;
