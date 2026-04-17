import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import TopBar from '../components/common/TopBar';
import ChatPanel from '../components/chat/ChatPanel';
import PreviewPanel from '../components/preview/PreviewPanel';
import CodeEditor from '../components/editor/CodeEditor';
import FileExplorer from '../components/editor/FileExplorer';
import ConsolePanel from '../components/common/ConsolePanel';
import { type ChatMessage, type BuilderState, type ProjectFile } from '../types';
import { filesToTree } from '../services/webcontainer/fileSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAIBuilder } from '../hooks/useAIBuilder';
import { useWebContainer } from '../hooks/useWebContainer';
import SettingsModal from '../components/settings/SettingsModal';
import './BuilderPage.css';

interface BuilderPageProps {
  initialPrompt: string;
}

const BuilderPage: React.FC<BuilderPageProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [builderState, setBuilderState] = useState<BuilderState>('idle');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentFiles, setCurrentFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'info' | 'success' | 'warn' | 'error'; text: string; timestamp: string }[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { getEffectiveApiKey, modelId } = useSettings();

  const { generate } = useAIBuilder();
  const { mount, install, runDev } = useWebContainer();

  // Ref to track if initial prompt was already processed
  const initialPromptProcessed = useRef(false);

  const handleNewMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setBuilderState('generating');

    try {
      const response = await generate(content, getEffectiveApiKey(), modelId);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        files: response.files,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (response.files && response.files.length > 0) {
        setCurrentFiles(response.files);
        setActiveFile(response.files.find(f => f.path.includes('App.tsx')) || response.files[0]);

        // Start WebContainer flow
        setBuilderState('installing');
        const tree = filesToTree(response.files);
        await mount(tree);
        await install();

        setBuilderState('running');
        await runDev(undefined, (url) => {
          setPreviewUrl(url);
        });
      } else {
        setBuilderState('idle');
      }
    } catch (error) {
      console.error("Build error:", error);
      setBuilderState('error');
    }
  }, [generate, mount, install, runDev, getEffectiveApiKey, modelId]);

  // Initialize build with prompt - only once
  useEffect(() => {
    if (initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      handleNewMessage(initialPrompt);
    }
  }, [initialPrompt]); // Removed handleNewMessage and messages.length from deps

  return (
    <div className="builder-container">
      <TopBar projectName="App Builder Pro" state={builderState} onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="builder-main">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Chat */}
          <Panel defaultSize={25} minSize={20} className="panel-chat">
            <ChatPanel 
              messages={messages} 
              onSendMessage={handleNewMessage}
              isGenerating={builderState === 'generating' || builderState === 'installing'}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* Right Panel: Preview / Editor */}
          <Panel defaultSize={75} className="panel-workspace">
            <div className="workspace-header">
              <div className="tabs">
                <button 
                  className={`tab-btn \${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  Preview
                </button>
                <button 
                  className={`tab-btn \${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  Code
                </button>
              </div>
              <div className="workspace-actions">
                <button className="btn-icon" onClick={() => setShowExplorer(!showExplorer)}>
                  {showExplorer ? "Hide Explorer" : "Show Explorer"}
                </button>
              </div>
            </div>

            <div className="workspace-content">
              {activeTab === 'preview' ? (
                <PreviewPanel state={builderState} url={previewUrl} />
              ) : (
                <div className="editor-layout">
                  {showExplorer && <FileExplorer files={currentFiles} />}
                  <CodeEditor 
                    fileName={activeFile?.path || 'App.tsx'}
                    code={activeFile?.content || ''}
                    language={activeFile?.path.endsWith('.css') ? 'css' : 'typescript'}
                  />
                </div>
              )}
            </div>
            
            <ConsolePanel logs={consoleLogs} />
          </Panel>
        </PanelGroup>
      </main>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default BuilderPage;
