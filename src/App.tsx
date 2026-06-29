import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatWindow } from './components/ChatWindow';
import { InputBox } from './components/InputBox';
import { SettingsModal } from './components/SettingsModal';
import { useChat } from './hooks/useChat';
import { useSpeechInput } from './hooks/useSpeechInput';
import { playGeminiTTS } from './lib/geminiTTS';

export default function App() {
  // Local storage credentials state
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('sonya_openrouter_key') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('sonya_gemini_key') || '');
  const [autoVoiceOutput, setAutoVoiceOutput] = useState(() => localStorage.getItem('sonya_auto_voice') === 'true');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('sonya_model') || 'cognitivecomputations/dolphin3.0-mistral-24b');
  const [provider, setProvider] = useState(() => localStorage.getItem('sonya_provider') || 'openrouter');

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');

  // Audio Playback state
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<number | null | string>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<number | null | string>(null);
  const activeAudioRef = useRef<{ stop: () => void } | null>(null);

  // Hook integrations
  const {
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
  } = useChat();

  const {
    isListening,
    isSupported: speechSupported,
    lang: speechLang,
    setLang: setSpeechLang,
    toggleListening,
  } = useSpeechInput((transcript) => {
    setInputVal((prev) => (prev ? prev + ' ' + transcript : transcript));
  });

  // Keep track of the active title to display in topbar
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeTitle = activeConversation ? activeConversation.title : 'New conversation';

  const [setupDismissed, setSetupDismissed] = useState(
    () => localStorage.getItem('sonya_setup_dismissed') === 'true'
  );

  const forceSetup = !setupDismissed && (!openRouterKey || !geminiKey);

  // On first mount or empty keys state, force triggers settings dialog opening
  useEffect(() => {
    if (forceSetup) {
      setIsSettingsOpen(true);
    }
  }, [forceSetup]);

  // Clean playVoiceText routine
  const playVoiceText = async (msgId: number | string, text: string) => {
    // 1. Terminate other active voice tracks
    if (activeAudioRef.current) {
      activeAudioRef.current.stop();
      activeAudioRef.current = null;
    }

    setTtsLoadingMsgId(msgId);
    setCurrentlyPlayingMsgId(null);

    // 2. Play Audio via Gemini Text-To-Speech
    const audioInstance = await playGeminiTTS(
      text,
      geminiKey,
      () => {
        setTtsLoadingMsgId(null);
        setCurrentlyPlayingMsgId(msgId);
      },
      () => {
        setTtsLoadingMsgId(null);
        setCurrentlyPlayingMsgId(null);
        activeAudioRef.current = null;
      }
    );

    if (audioInstance) {
      activeAudioRef.current = audioInstance;
    } else {
      setTtsLoadingMsgId(null);
      setCurrentlyPlayingMsgId(null);
    }
  };

  const stopVoiceText = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.stop();
      activeAudioRef.current = null;
    }
    setCurrentlyPlayingMsgId(null);
    setTtsLoadingMsgId(null);
  };

  // Terminate voice immediately if active conversation changes
  useEffect(() => {
    stopVoiceText();
  }, [activeConversationId]);

  const handleSaveSettings = (settings: { openRouterKey: string; geminiKey: string; autoVoiceOutput: boolean }) => {
    // Persist to state
    setOpenRouterKey(settings.openRouterKey);
    setGeminiKey(settings.geminiKey);
    setAutoVoiceOutput(settings.autoVoiceOutput);

    // Persist to LocalStorage
    localStorage.setItem('sonya_openrouter_key', settings.openRouterKey);
    localStorage.setItem('sonya_gemini_key', settings.geminiKey);
    localStorage.setItem('sonya_auto_voice', settings.autoVoiceOutput ? 'true' : 'false');
    localStorage.setItem('sonya_setup_dismissed', 'true');
    setSetupDismissed(true);
    setIsSettingsOpen(false);
  };

  const handleSkipSetup = () => {
    localStorage.setItem('sonya_setup_dismissed', 'true');
    setSetupDismissed(true);
    setIsSettingsOpen(false);
  };

  const handleChangeModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('sonya_model', modelId);
  };

  const handleChangeProvider = (newProvider: string) => {
    setProvider(newProvider);
    localStorage.setItem('sonya_provider', newProvider);

    const defaultModel = newProvider === 'groq'
      ? 'llama-3.3-70b-versatile'
      : 'cognitivecomputations/dolphin3.0-mistral-24b';

    setSelectedModel(defaultModel);
    localStorage.setItem('sonya_model', defaultModel);
  };

  const handleSendMessage = (imageBase64?: string) => {
    if (!inputVal.trim()) return;
    const textToSend = inputVal.trim();
    setInputVal('');

    // Cancel speech if active before sending
    if (isListening) {
      toggleListening();
    }

    sendMessage(
      textToSend,
      openRouterKey,
      selectedModel,
      provider,
      imageBase64,
      (fullTextReply) => {
        // Callback executed upon completion of OpenRouter stream
        if (autoVoiceOutput && geminiKey) {
          playVoiceText(activeConversationId || 'streaming', fullTextReply);
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full relative bg-black text-[#e2d9ff] font-sans flex text-rendering" id="sonya-application-root">
      {/* Dynamic Ambient Blur Canopy */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none transition-all duration-1000"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.25), transparent 70%)',
        }}
        id="ambient-aurora-bg"
      />

      <div className="flex w-full h-screen z-10 overflow-hidden relative" id="layout-grid-workspace">
        {/* Responsive left hand sidebar drawer controls */}
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
          onNewChat={startNewConversation}
          onDelete={deleteConversation}
          onRename={renameConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Right hand main viewport workspace */}
        <div className="flex-1 flex flex-col min-w-0" id="main-viewport-console">
          <TopBar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedModel={selectedModel}
            onChangeModel={handleChangeModel}
            provider={provider}
            onChangeProvider={handleChangeProvider}
            onOpenSettings={() => setIsSettingsOpen(true)}
            activeId={activeConversationId}
            activeTitle={activeTitle}
            onRenameActive={renameConversation}
            onDeleteActive={deleteConversation}
          />

          <ChatWindow
            activeId={activeConversationId}
            activeTitle={activeTitle}
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            streamingMessage={streamingMessage}
            sendError={sendError}
            geminiKeyConfigured={!!geminiKey}
            currentlyPlayingMsgId={currentlyPlayingMsgId}
            ttsLoadingMsgId={ttsLoadingMsgId}
            onPlayVoice={playVoiceText}
            onStopVoice={stopVoiceText}
            onEditMessage={editAndResend}
          />

          {/* Bottom message tray bar layout */}
          <InputBox
            value={inputVal}
            onChange={setInputVal}
            onSend={handleSendMessage}
            disableSend={false}
            isListening={isListening}
            isStreaming={isStreaming}
            speechSupported={speechSupported}
            speechLang={speechLang}
            onToggleListening={toggleListening}
            onChangeSpeechLang={setSpeechLang}
            onCancelStreaming={cancelStreaming}
          />
        </div>
      </div>

      {/* API Credential Preferences Dialog Portal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        openRouterKey={openRouterKey}
        geminiKey={geminiKey}
        autoVoiceOutput={autoVoiceOutput}
        onSave={handleSaveSettings}
        forceSetup={forceSetup}
        onSkip={handleSkipSetup}
      />
    </div>
  );
}
