import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import TopBar from '../components/common/TopBar';
import ChatPanel from '../components/chat/ChatPanel';
import PreviewPanel from '../components/preview/PreviewPanel';
import CodeEditor from '../components/editor/CodeEditor';
import FileExplorer from '../components/editor/FileExplorer';
import ConsolePanel from '../components/common/ConsolePanel';
import BuildErrorPanel from '../components/common/BuildErrorPanel';
import BackendCreationModal from '../components/backend/BackendCreationModal';
import CredentialsModal from '../components/backend/CredentialsModal';
import { ToastProvider, useToast } from '../components/common/Toast';
import { type ChatMessage, type BuilderState, type ProjectFile } from '../types';
import { filesToTree } from '../services/webcontainer/fileSystem';
import { useSettings } from '../contexts/SettingsContext';
import { useAIBuilder } from '../hooks/useAIBuilder';
import { useWebContainer } from '../hooks/useWebContainer';
import { useConsoleLogs } from '../hooks/useConsoleLogs';
import { useBackendCreation } from '../hooks/backend/pipeline/useBackendCreation';
import { useSupabaseOAuth } from '../hooks/backend/oauth/useSupabaseOAuth';
import { adaptProject } from '../services/adapter';
import SettingsModal from '../components/settings/SettingsModal';
import { PipelineStage } from '../hooks/backend/pipeline/types';
import { getGenericErrorMessage, logErrorSafe, logWarnSafe } from '../utils/logger';
import './BuilderPage.css';
import '../components/common/Toast.css';

interface BuilderPageProps {
  initialPrompt: string;
}

/**
 * Inner component that uses toast
 */
const BuilderPageInner: React.FC<BuilderPageProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [builderState, setBuilderState] = useState<BuilderState>('idle');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentFiles, setCurrentFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const { logs: consoleLogs, addLog, clearLogs } = useConsoleLogs();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [_applyError, setApplyError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<unknown>(null);
  const { getEffectiveApiKey, modelId } = useSettings();
  const { showToast } = useToast();

  const { generate } = useAIBuilder();
  const { mount, install, runDev } = useWebContainer();

  // Backend creation hooks
  const { isAuthenticated } = useSupabaseOAuth();
  const {
    stage: backendStage,
    progress: backendProgress,
    isCreating: isCreatingBackend,
    error: backendError,
    result: backendResult,
    requirements: backendRequirements,
    createBackend,
    retry: retryBackend,
    reset: resetBackend,
  } = useBackendCreation();

  // Ref to track if initial prompt was already processed
  const initialPromptProcessed = useRef(false);

  const handleNewMessage = useCallback(
    async (content: string) => {
      // Clear backend state before generating new code (RA-007)
      resetBackend();
      // Close credentials modal if open (RA-007)
      setShowCredentialsModal(false);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setBuilderState('generating');

      try {
        const response = await generate(content, getEffectiveApiKey(), modelId);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          files: response.files,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (response.warnings && response.warnings.length > 0) {
          response.warnings.forEach((w) => showToast({ message: w, type: 'error' }));
        }

        if (response.files && response.files.length > 0) {
          setCurrentFiles(response.files);
          setActiveFile(
            response.files.find((f) => f.path.includes('App.tsx')) || response.files[0]
          );

          // Start WebContainer flow
          setBuilderState('installing');
          const tree = filesToTree(response.files);
          await mount(tree);
          await install(addLog);

          setBuilderState('running');
          await runDev(addLog, (url) => {
            setPreviewUrl(url);
          });
        } else {
          setBuilderState('idle');
        }
      } catch (error) {
        setLastError(error);
        setBuilderState('error');
      }
    },
    [generate, mount, install, runDev, getEffectiveApiKey, modelId, resetBackend, showToast]
  );

  // Handler for retry after build error
  const handleRetry = useCallback(() => {
    setBuilderState('idle');
    setLastError(null);
  }, []);

  // Initialize build with prompt - only once
  useEffect(() => {
    if (initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      handleNewMessage(initialPrompt);
    }
  }, [initialPrompt]); // Removed handleNewMessage and messages.length from deps

  // Handler for opening backend modal
  const handleOpenBackendModal = useCallback(() => {
    setIsBackendModalOpen(true);
  }, []);

  // Handler for closing backend modal
  const handleCloseBackendModal = useCallback(() => {
    setIsBackendModalOpen(false);
  }, []);

  // Handler for creating backend
  const handleCreateBackend = useCallback(async () => {
    if (currentFiles.length === 0) return;

    // Convert files to code string for analysis
    const codeString = currentFiles.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');

    await createBackend(codeString, {
      projectName: 'generated-backend',
      region: 'us-east-1',
    });
  }, [currentFiles, createBackend]);

  // Handler for retry
  const handleRetryBackend = useCallback(() => {
    retryBackend();
  }, [retryBackend]);

  // Start backend creation when modal opens
  useEffect(() => {
    if (isBackendModalOpen && !isCreatingBackend && backendStage === 'idle') {
      handleCreateBackend();
    }
  }, [isBackendModalOpen, isCreatingBackend, backendStage, handleCreateBackend]);

  // Handle pipeline completion - close BackendCreationModal and open CredentialsModal
  useEffect(() => {
    if (backendStage === PipelineStage.COMPLETE && backendResult && !showCredentialsModal) {
      // Close the BackendCreationModal
      setIsBackendModalOpen(false);
      // Open the CredentialsModal
      setShowCredentialsModal(true);
    }
  }, [backendStage, backendResult, showCredentialsModal]);

  // Handler for closing CredentialsModal
  const handleCloseCredentialsModal = useCallback(() => {
    setShowCredentialsModal(false);
  }, []);

  // Handler for applying backend to current project
  const handleApplyBackend = useCallback(async () => {
    // Clear any previous error
    setApplyError(null);

    // Guard clause: need result
    if (!backendResult) {
      logWarnSafe('ApplyBackend', 'Cannot apply backend: missing result');
      showToast({
        message: 'Backend result not available. Please recreate the backend.',
        type: 'error',
      });
      return;
    }

    // Guard clause: need requirements
    if (!backendRequirements) {
      logWarnSafe('ApplyBackend', 'Cannot apply backend: missing requirements');
      showToast({
        message: 'Backend requirements not available. Please recreate the backend.',
        type: 'error',
      });
      return;
    }

    setIsApplying(true);

    try {
      // Get current files from state
      const currentFilesToAdapt = currentFiles;

      // Call adaptProject with current files and backend info
      const adapted = adaptProject({
        files: currentFilesToAdapt,
        backendResult: backendResult,
        requirements: backendRequirements,
      });

      // If adaptation was skipped, show toast and keep modal open
      if (adapted.skipped) {
        logWarnSafe('ApplyBackend', `Backend adaptation skipped: ${adapted.reason}`);
        showToast({
          message:
            adapted.reason ||
            "No backend integration needed - the generated code doesn't use Supabase features.",
          type: 'info',
        });
        return; // Keep modal open
      }

      // Update current files with adapted files
      setCurrentFiles(adapted.files);

      // Remount WebContainer with adapted files
      const tree = filesToTree(adapted.files);
      await mount(tree);
      await install(addLog);
      await runDev(addLog, (url) => {
        setPreviewUrl(url);
      });

      // Close modal on success
      setShowCredentialsModal(false);

      // Show success toast
      showToast({
        message: 'Backend applied successfully!',
        type: 'success',
      });
    } catch (error) {
      logErrorSafe('ApplyBackend', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApplyError(errorMessage);
      showToast({
        message: 'Failed to apply backend. Please try again.',
        type: 'error',
      });
      // Keep modal open so user can retry
    } finally {
      setIsApplying(false);
    }
  }, [backendResult, backendRequirements, currentFiles, mount, install, runDev, showToast]);

  return (
    <div className="builder-container">
      <TopBar
        projectName="App Builder Pro"
        state={builderState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasGeneratedCode={currentFiles.length > 0}
        hasOAuthToken={isAuthenticated}
        isCreatingBackend={isCreatingBackend}
        onCreateBackend={handleOpenBackendModal}
      />

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
                  {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
                </button>
              </div>
            </div>

            <div className="workspace-content">
              {builderState === 'error' ? (
                <BuildErrorPanel
                  message={
                    lastError ? getGenericErrorMessage(lastError) : 'An unexpected error occurred.'
                  }
                  onRetry={handleRetry}
                />
              ) : (
                <>
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
                </>
              )}
            </div>

            <ConsolePanel logs={consoleLogs} onClear={clearLogs} onClose={() => {}} />
          </Panel>
        </PanelGroup>
      </main>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isBackendModalOpen && (
        <BackendCreationModal
          stage={backendStage}
          progress={backendProgress}
          error={backendError}
          isCreating={isCreatingBackend}
          onRetry={handleRetryBackend}
          onClose={handleCloseBackendModal}
        />
      )}
      {showCredentialsModal && backendResult && (
        <CredentialsModal
          result={backendResult}
          requirements={backendRequirements}
          onClose={handleCloseCredentialsModal}
          onApply={handleApplyBackend}
          isApplying={isApplying}
        />
      )}
    </div>
  );
};

/**
 * Main BuilderPage component with ToastProvider wrapper
 */
const BuilderPage: React.FC<BuilderPageProps> = (props) => {
  return (
    <ToastProvider>
      <BuilderPageInner {...props} />
    </ToastProvider>
  );
};

export default BuilderPage;
