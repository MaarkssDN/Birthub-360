import React from 'react';
import { SettingsModal } from './SettingsModal.js';
import { CliExportModal } from './CliExportModal.js';
import { CheckpointsModal } from './CheckpointsModal.js';
import { GitHubExportModal } from './GitHubExportModal.js';
import { TokenStatsModal } from './TokenStatsModal.js';
import { SearchModal } from './SearchModal.js';
import { UnitTestGeneratorModal } from './UnitTestGeneratorModal.js';
import { CodeAnalysisModal } from './CodeAnalysisModal.js';
import { AIStudioModal } from './AIStudioModal.js';
import { FirebaseAuthModal } from './FirebaseAuthModal.js';
import { GitControlModal } from './GitControlModal.js';
import { auth } from '../firebase/config.js';
import type { CodeSelectionContext, ProviderConfig, StorageMode, WorkspaceCheckpoint } from '../types/agent.js';

export interface IdeModalsManagerProps {
  checkpointsOpen: boolean;
  setCheckpointsOpen: (open: boolean) => void;
  checkpoints: WorkspaceCheckpoint[];
  handleRestoreCheckpoint: (cp: WorkspaceCheckpoint) => void;
  handleCreateSnapshot: (name?: string) => void | Promise<void>;
  handleDeleteCheckpoint: (id: string) => void;

  githubModalOpen: boolean;
  setGithubModalOpen: (open: boolean) => void;
  allFiles: Record<string, string>;
  localFolderName: string | null;

  tokenStatsOpen: boolean;
  setTokenStatsOpen: (open: boolean) => void;
  tokenStats: any;
  handleResetTokenStats: () => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  config: ProviderConfig;
  handleSaveConfig: (cfg: ProviderConfig) => void;
  hasEnvGemini: boolean;
  fsManager: any;
  refreshWorkspace: () => Promise<void>;

  cliModalOpen: boolean;
  setCliModalOpen: (open: boolean) => void;

  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  handleSelectFile: (path: string) => void;
  setActiveCenterTab: (tab: 'editor' | 'diff' | 'preview') => void;

  unitTestModalOpen: boolean;
  setUnitTestModalOpen: (open: boolean) => void;
  selectedPath: string | null;
  fileContent: string;
  handleCreateTestFile: (path: string, content: string) => Promise<void>;
  setTerminalOpen: (open: boolean) => void;
  setTerminalExternalCmd: (cmd: { cmd: string; timestamp: number } | null) => void;

  codeAnalysisModalOpen: boolean;
  setCodeAnalysisModalOpen: (open: boolean) => void;
  selectedCodeContext: CodeSelectionContext | null;
  handleApplyRefactoredCode: (newCode: string, isSnippetOnly: boolean) => void | Promise<void>;

  aiStudioOpen: boolean;
  setAiStudioOpen: (open: boolean) => void;
  aiStudioDefaultTab: 'chat' | 'music' | 'image' | 'video' | 'live' | 'grounding' | 'transcribe' | 'saved';
  handleSaveEditorContent: (content: string) => void;
  setAppToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;

  firebaseAuthOpen: boolean;
  setFirebaseAuthOpen: (open: boolean) => void;

  gitModalOpen: boolean;
  setGitModalOpen: (open: boolean) => void;
  updateGitStatus: () => void;
  storageMode: StorageMode;
  gitDefaultTab: 'changes' | 'history' | 'branches';
  handleUpdateAllFilesFromGit: (files: Record<string, string>) => void;
  setDiffInfo: (diff: any) => void;
}

export function IdeModalsManager({
  checkpointsOpen,
  setCheckpointsOpen,
  checkpoints,
  handleRestoreCheckpoint,
  handleCreateSnapshot,
  handleDeleteCheckpoint,
  githubModalOpen,
  setGithubModalOpen,
  allFiles,
  localFolderName,
  tokenStatsOpen,
  setTokenStatsOpen,
  tokenStats,
  handleResetTokenStats,
  settingsOpen,
  setSettingsOpen,
  config,
  handleSaveConfig,
  hasEnvGemini,
  fsManager,
  refreshWorkspace,
  cliModalOpen,
  setCliModalOpen,
  searchModalOpen,
  setSearchModalOpen,
  handleSelectFile,
  setActiveCenterTab,
  unitTestModalOpen,
  setUnitTestModalOpen,
  selectedPath,
  fileContent,
  handleCreateTestFile,
  setTerminalOpen,
  setTerminalExternalCmd,
  codeAnalysisModalOpen,
  setCodeAnalysisModalOpen,
  selectedCodeContext,
  handleApplyRefactoredCode,
  aiStudioOpen,
  setAiStudioOpen,
  aiStudioDefaultTab,
  handleSaveEditorContent,
  setAppToast,
  firebaseAuthOpen,
  setFirebaseAuthOpen,
  gitModalOpen,
  setGitModalOpen,
  updateGitStatus,
  storageMode,
  gitDefaultTab,
  handleUpdateAllFilesFromGit,
  setDiffInfo,
}: IdeModalsManagerProps): React.ReactElement {
  return (
    <>
      <CheckpointsModal
        isOpen={checkpointsOpen}
        onClose={() => setCheckpointsOpen(false)}
        checkpoints={checkpoints}
        onRestoreCheckpoint={handleRestoreCheckpoint}
        onCreateCheckpoint={handleCreateSnapshot}
        onDeleteCheckpoint={handleDeleteCheckpoint}
      />

      <GitHubExportModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        files={allFiles}
        defaultRepoName={
          localFolderName ? localFolderName.toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'meu-projeto-agente'
        }
      />

      <TokenStatsModal
        isOpen={tokenStatsOpen}
        onClose={() => setTokenStatsOpen(false)}
        stats={tokenStats}
        onResetStats={handleResetTokenStats}
        currentProvider={config.provider}
        currentModel={config.model}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        hasEnvGemini={hasEnvGemini}
        onSaveEslintToWorkspace={async (eslintrcContent: string) => {
          await fsManager.writeFile('.eslintrc.json', eslintrcContent);
          await refreshWorkspace();
        }}
      />

      <CliExportModal isOpen={cliModalOpen} onClose={() => setCliModalOpen(false)} />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        files={allFiles}
        onOpenFile={(path) => {
          handleSelectFile(path);
          setActiveCenterTab('editor');
        }}
      />

      <UnitTestGeneratorModal
        isOpen={unitTestModalOpen}
        onClose={() => setUnitTestModalOpen(false)}
        filePath={selectedPath}
        fileContent={fileContent}
        config={config}
        onCreateTestFile={handleCreateTestFile}
        onRunInTerminal={(cmd) => {
          setTerminalOpen(true);
          setTerminalExternalCmd({ cmd, timestamp: Date.now() });
        }}
      />

      <CodeAnalysisModal
        isOpen={codeAnalysisModalOpen}
        onClose={() => setCodeAnalysisModalOpen(false)}
        filePath={selectedPath}
        codeToAnalyze={selectedCodeContext?.code || fileContent}
        selectionContext={selectedCodeContext}
        config={config}
        onApplyRefactoredCode={handleApplyRefactoredCode}
        onJumpToLine={() => {
          setCodeAnalysisModalOpen(false);
        }}
      />

      <AIStudioModal
        isOpen={aiStudioOpen}
        onClose={() => setAiStudioOpen(false)}
        defaultTab={aiStudioDefaultTab}
        onInsertCode={(code) => {
          if (selectedPath) {
            handleSaveEditorContent(fileContent + '\n\n' + code);
          }
        }}
        onNotify={(msg, type) => {
          setAppToast({ message: msg, type });
          setTimeout(() => setAppToast(null), 4000);
        }}
      />

      <FirebaseAuthModal
        isOpen={firebaseAuthOpen}
        onClose={() => setFirebaseAuthOpen(false)}
        files={allFiles}
        onNotify={(msg, type) => {
          setAppToast({ message: msg, type });
          setTimeout(() => setAppToast(null), 4000);
        }}
      />

      <GitControlModal
        isOpen={gitModalOpen}
        onClose={() => {
          setGitModalOpen(false);
          updateGitStatus();
        }}
        files={allFiles}
        workspaceId={storageMode === 'local' ? localFolderName || 'local' : 'virtual'}
        initialTab={gitDefaultTab}
        onFilesUpdated={handleUpdateAllFilesFromGit}
        onNotify={(msg, type) => {
          setAppToast({ message: msg, type });
          setTimeout(() => setAppToast(null), 4000);
          updateGitStatus();
        }}
        onOpenDiffTab={(path, oldContent, newContent) => {
          setDiffInfo({
            path,
            oldContent,
            newContent,
            timestamp: Date.now(),
          });
          setActiveCenterTab('diff');
        }}
        userEmail={auth.currentUser?.email || undefined}
        customGeminiKey={config.geminiKey}
      />
    </>
  );
}
