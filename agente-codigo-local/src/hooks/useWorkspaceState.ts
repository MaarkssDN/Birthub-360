import { useState, useRef, useMemo } from 'react';
import type {
  StorageMode,
  FileTreeNode,
  FileDiffInfo,
  WorkspaceCheckpoint,
  TokenUsageStats,
  CodeSelectionContext,
  ProviderConfig,
  ChatMessage,
  StepLog,
} from '../types/agent';
import { FileSystemManager } from '../services/fileSystem';
import { DEFAULT_ESLINT_CONFIG } from '../services/eslintHelper';
import { sounds } from '../services/soundEffects';
import type { ActivityTab } from '../components/ActivityBar';
import type { AgentMode } from '../components/CommandPalette';
import type { PendingApprovalData } from '../components/AgentChat';

export function useWorkspaceState() {
  const fsManager = useMemo(() => new FileSystemManager(), []);

  // UI state
  const [storageMode, setStorageMode] = useState<StorageMode>('virtual');
  const [localFolderName, setLocalFolderName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeCenterTab, setActiveCenterTab] = useState<'editor' | 'diff' | 'preview'>('editor');
  const [diffInfo, setDiffInfo] = useState<FileDiffInfo | null>(null);
  const [allFiles, setAllFiles] = useState<Record<string, string>>({});
  const [hasWebEntry, setHasWebEntry] = useState<boolean>(false);

  // Modern IDE Panels layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('files');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Modals & Panels
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cliModalOpen, setCliModalOpen] = useState(false);
  const [checkpointsOpen, setCheckpointsOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [tokenStatsOpen, setTokenStatsOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [unitTestModalOpen, setUnitTestModalOpen] = useState(false);
  const [codeAnalysisModalOpen, setCodeAnalysisModalOpen] = useState(false);
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [aiStudioDefaultTab, setAiStudioDefaultTab] = useState<
    'chat' | 'music' | 'image' | 'video' | 'live' | 'grounding' | 'transcribe' | 'saved'
  >('chat');
  const [firebaseAuthOpen, setFirebaseAuthOpen] = useState(false);
  const [appToast, setAppToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedCodeContext, setSelectedCodeContext] = useState<CodeSelectionContext | null>(null);
  const [terminalExternalCmd, setTerminalExternalCmd] = useState<{ cmd: string; timestamp: number } | null>(null);
  const [agentMode, setAgentMode] = useState<AgentMode>(() => {
    try {
      const saved = localStorage.getItem('local_agent_mode');
      if (saved === 'turbo' || saved === 'architect' || saved === 'security') return saved;
    } catch {}
    return 'turbo';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sounds.isEnabled());

  // Git Version Control state
  const [gitModalOpen, setGitModalOpen] = useState(false);
  const [gitDefaultTab, setGitDefaultTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [uncommittedGitCount, setUncommittedGitCount] = useState<number>(0);
  const [currentGitBranch, setCurrentGitBranch] = useState<string>('main');

  // Human-in-the-loop approval state
  const [approvalMode, setApprovalMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('local_agent_approval_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalData | null>(null);
  const pendingApprovalResolverRef = useRef<((approved: boolean, reason?: string) => void) | null>(null);

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState<WorkspaceCheckpoint[]>(() => {
    try {
      const saved = localStorage.getItem('local_agent_checkpoints');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Token usage
  const [tokenStats, setTokenStats] = useState<TokenUsageStats>(() => {
    try {
      const saved = localStorage.getItem('local_agent_token_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      callCount: 0,
    };
  });

  // Chat external input (e.g. from code selection)
  const [chatInputExternal, setChatInputExternal] = useState<string>('');

  // Provider configuration
  const [hasEnvGemini, setHasEnvGemini] = useState(false);
  const [config, setConfig] = useState<ProviderConfig>(() => {
    try {
      const saved = localStorage.getItem('local_agent_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.eslintConfig) {
          parsed.eslintConfig = { ...DEFAULT_ESLINT_CONFIG };
        }
        return parsed;
      }
    } catch {}
    return {
      provider: 'gemini',
      geminiKey: '',
      groqKey: '',
      julesKey: '',
      julesSource: '',
      openRouterKey: '',
      ollamaHost: 'http://localhost:11434',
      customBaseUrl: 'http://localhost:1234/v1',
      customApiKey: '',
      model: 'gemini-2.5-flash',
      maxSteps: 20,
      temperature: 0.2,
      eslintConfig: { ...DEFAULT_ESLINT_CONFIG },
    };
  });

  // Chat & Execution state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSteps, setCurrentSteps] = useState<StepLog[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const abortControllerRef = useRef<boolean>(false);

  return {
    fsManager,
    storageMode, setStorageMode,
    localFolderName, setLocalFolderName,
    fileTree, setFileTree,
    selectedPath, setSelectedPath,
    fileContent, setFileContent,
    openTabs, setOpenTabs,
    activeCenterTab, setActiveCenterTab,
    diffInfo, setDiffInfo,
    allFiles, setAllFiles,
    hasWebEntry, setHasWebEntry,
    isSidebarOpen, setIsSidebarOpen,
    activeActivityTab, setActiveActivityTab,
    isChatOpen, setIsChatOpen,
    settingsOpen, setSettingsOpen,
    cliModalOpen, setCliModalOpen,
    checkpointsOpen, setCheckpointsOpen,
    githubModalOpen, setGithubModalOpen,
    tokenStatsOpen, setTokenStatsOpen,
    terminalOpen, setTerminalOpen,
    searchModalOpen, setSearchModalOpen,
    commandPaletteOpen, setCommandPaletteOpen,
    unitTestModalOpen, setUnitTestModalOpen,
    codeAnalysisModalOpen, setCodeAnalysisModalOpen,
    aiStudioOpen, setAiStudioOpen,
    aiStudioDefaultTab, setAiStudioDefaultTab,
    firebaseAuthOpen, setFirebaseAuthOpen,
    appToast, setAppToast,
    selectedCodeContext, setSelectedCodeContext,
    terminalExternalCmd, setTerminalExternalCmd,
    agentMode, setAgentMode,
    soundEnabled, setSoundEnabled,
    gitModalOpen, setGitModalOpen,
    gitDefaultTab, setGitDefaultTab,
    uncommittedGitCount, setUncommittedGitCount,
    currentGitBranch, setCurrentGitBranch,
    approvalMode, setApprovalMode,
    pendingApproval, setPendingApproval,
    pendingApprovalResolverRef,
    checkpoints, setCheckpoints,
    tokenStats, setTokenStats,
    chatInputExternal, setChatInputExternal,
    hasEnvGemini, setHasEnvGemini,
    config, setConfig,
    messages, setMessages,
    currentSteps, setCurrentSteps,
    isBusy, setIsBusy,
    statusText, setStatusText,
    abortControllerRef,
  };
}
