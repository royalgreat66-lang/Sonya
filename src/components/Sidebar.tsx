import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Edit2, Trash2, Check, X, Menu, Settings } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  isOpen,
  onClose,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setDeletingId(null);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleStartDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    setEditingId(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    onDelete(id);
    setDeletingId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  // Group threads by date
  const groupConversations = () => {
    const todayGroup: Conversation[] = [];
    const yesterdayGroup: Conversation[] = [];
    const earlierGroup: Conversation[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    conversations.forEach((c) => {
      const updatedAtDate = new Date(c.updatedAt);
      if (updatedAtDate >= startOfToday) {
        todayGroup.push(c);
      } else if (updatedAtDate >= startOfYesterday) {
        yesterdayGroup.push(c);
      } else {
        earlierGroup.push(c);
      }
    });

    return { todayGroup, yesterdayGroup, earlierGroup };
  };

  const { todayGroup, yesterdayGroup, earlierGroup } = groupConversations();

  const renderItem = (conv: Conversation) => {
    const isSelected = conv.id === activeId;
    const isEditing = conv.id === editingId;
    const isDeleting = conv.id === deletingId;

    if (isEditing) {
      return (
        <form
          key={conv.id}
          onSubmit={(e) => handleSaveRename(e, conv.id!)}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/20 border-b-[0.5px] border-violet-500/20 rounded-lg"
          onClick={(e) => e.stopPropagation()}
          id={`edit-form-${conv.id}`}
        >
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 bg-transparent text-sm text-[#e2d9ff] outline-none border-b border-violet-500"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditingId(null);
            }}
            maxLength={100}
            id={`edit-input-${conv.id}`}
          />
          <button
            type="submit"
            className="p-1 text-green-400 hover:text-green-300 transition-colors"
            id={`confirm-rename-${conv.id}`}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={handleCancelRename}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            id={`cancel-rename-${conv.id}`}
          >
            <X size={14} />
          </button>
        </form>
      );
    }

    if (isDeleting) {
      return (
        <div
          key={conv.id}
          className="flex items-center justify-between gap-1.5 px-3 py-2 bg-red-950/20 border-b-[0.5px] border-red-500/20 rounded-lg animate-pulse"
          onClick={(e) => e.stopPropagation()}
          id={`delete-confirm-${conv.id}`}
        >
          <span className="text-xs text-red-200 font-medium">Delete?</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleConfirmDelete(e, conv.id!)}
              className="px-2 py-0.5 bg-red-600 rounded text-[10px] text-white hover:bg-red-500 transition-colors"
              id={`confirm-delete-${conv.id}`}
            >
              Yes
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-[#e2d9ff] hover:bg-zinc-700 transition-colors"
              id={`cancel-delete-${conv.id}`}
            >
              No
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={conv.id}
        onClick={() => {
          onSelect(conv.id!);
          onClose(); // auto closes on mobile when selecting
        }}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all border ${
          isSelected
            ? 'bg-[#8b5cf6]/12 border-[#8b5cf6]/30 text-violet-200'
            : 'border-transparent hover:bg-white/5 text-[#888] hover:text-[#e2d9ff]'
        }`}
        id={`conv-item-${conv.id}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            size={15}
            className={`flex-shrink-0 ${isSelected ? 'text-[#8b5cf6]' : 'text-zinc-600'}`}
          />
            <span className="text-sm font-medium leading-tight truncate pr-16 lg:pr-4">
            {conv.title}
          </span>
        </div>

        {/* Hover Action HUD */}
          {/* Buttons always visible on mobile, hover only on desktop */}
          <div className="absolute right-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-gradient-to-l from-zinc-950/90 via-zinc-950/50 to-transparent pl-3 h-full">
          <button
            onClick={(e) => handleStartRename(e, conv.id!, conv.title)}
            className="p-1 text-[#888] hover:text-[#8b5cf6] hover:bg-white/5 rounded transition-colors"
            title="Rename"
            id={`btn-rename-${conv.id}`}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => handleStartDelete(e, conv.id!)}
            className="p-1 text-[#888] hover:text-red-400 hover:bg-white/5 rounded transition-colors"
            title="Delete"
            id={`btn-delete-${conv.id}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1" id={`section-${title.toLowerCase()}`}>
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-semibold px-2 mb-2">
          {title}
        </div>
        <div className="space-y-1">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          id="sidebar-overlay"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[270px] bg-[#0a0810]/85 backdrop-blur-xl border-r border-[#8b5cf6]/20 flex flex-col transition-transform duration-300 ease-out-in pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="sidebar-container"
      >
        {/* Header Console */}
        <div className="p-6 flex items-center justify-between border-b border-[#8b5cf6]/10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#e2d9ff]">
              Sonya
            </span>
            <span className="text-[10px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-1 py-0.2 rounded text-[#e2d9ff]/80 font-mono">
              v1.0
            </span>
          </div>
          
          <button
            onClick={() => {
              onNewChat();
              onClose(); // auto close on mobile
            }}
            className="p-1.5 bg-violet-600/10 hover:bg-violet-600/20 border-[0.5px] border-[#8b5cf6]/30 text-[#e2d9ff] hover:text-white rounded-lg transition-colors flex items-center justify-center"
            title="New Conversation"
            id="btn-new-chat"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Scrollable Conversation Thread Feed */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
          {conversations.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-center px-4" id="empty-threads">
              <span className="text-xs text-[#444] italic">No conversations yet</span>
            </div>
          ) : (
            <>
              {renderSection('Today', todayGroup)}
              {renderSection('Yesterday', yesterdayGroup)}
              {renderSection('Earlier', earlierGroup)}
            </>
          )}
        </div>

        <div className="lg:hidden px-4 py-3 border-t border-[#8b5cf6]/10">
          <button
            onClick={onOpenSettings}
            className="p-2 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-[#e2d9ff] hover:text-white rounded-lg transition-all"
            title="Open API Credentials Management"
            id="sidebar-settings-trigger"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Bottom Workspace Anchor */}
        <div className="p-4 border-t border-[#8b5cf6]/10 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-mono">Local IndexedDB Mode</span>
          <button
            onClick={onClose}
            className="lg:hidden text-xs text-[#888] hover:text-[#e2d9ff] px-2 py-1 bg-white/5 rounded-md"
            id="close-sidebar-btn"
          >
            Hide
          </button>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
