// Electron Preload API 类型定义
// 此文件定义 window.api 对象的类型，与 electron/preload/index.ts 保持一致

// Agent 相关类型定义（与 src/types/agent.ts 保持一致）
type AgentStatus = 'idle' | 'running' | 'error' | 'disabled' | 'initializing';

interface AgentModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  modelId: string;
  apiKey?: string;
}

interface AgentParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

interface AgentSkillConfig {
  skillKey: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: AgentModelConfig;
  systemPrompt: string;
  parameters: AgentParameters;
  skills: AgentSkillConfig[];
  createdAt: string;
  updatedAt: string;
  status: AgentStatus;
  disabled?: boolean;
}

type AgentCreateInput = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>;
type AgentUpdateInput = Partial<AgentConfig>;

interface AgentListFilter {
  status?: AgentStatus;
  search?: string;
}

// RPA 类型定义 - 从 ./rpa 导入
import type {
  RpaTask,
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  RpaExecutionResult,
  ScreenCaptureOptions,
  OcrOptions,
  OcrResult,
  ElementRecognitionOptions,
  RecognizedElement,
  WindowQueryOptions,
  WindowInfo,
  RpaStepLog,
} from './rpa';

// Electron API 接口定义
export interface ElectronAPI {
  // Platform
  platform: string;
  quitApp: () => Promise<void>;
  onOpenContactModal: (listener: () => void) => () => void;
  onOpenModelsPage: (listener: () => void) => () => void;
  getOpenClawPaths: () => Promise<any>;

  // Environment
  checkNode: () => Promise<any>;
  checkOpenClaw: () => Promise<any>;
  prepareMacGitTools: () => Promise<void>;
  installNode: () => Promise<void>;
  resolveNodeInstallPlan: () => Promise<any>;
  downloadNodeInstaller: (plan?: any) => Promise<string>;
  inspectNodeInstaller: (installerPath: string) => Promise<any>;
  installEnv: (opts: any) => Promise<void>;
  refreshEnvironment: () => Promise<void>;
  waitForCommand: (command: string, args?: string[]) => Promise<void>;

  // Command control
  cancelCommand: () => Promise<any>;
  cancelCommandDetailed: () => Promise<any>;
  cancelCommandDomain: (domain: string) => Promise<void>;
  cancelCommands: (domains: string[]) => Promise<void>;

  // Install & OpenClaw
  installOpenClaw: () => Promise<void>;
  discoverOpenClaw: () => Promise<any>;
  checkOpenClawLatestVersion: () => Promise<string>;
  ensureOpenClawBaselineBackup: (candidate: any) => Promise<void>;
  skipOpenClawBaselineBackup: (candidate: any) => Promise<void>;
  getOpenClawBaselineBackupStatus: (installFingerprint: string) => Promise<any>;
  markManagedOpenClawInstall: (installFingerprint: string) => Promise<void>;
  getOpenClawDataGuard: (candidate?: any) => Promise<any>;
  prepareManagedOpenClawConfigWrite: (candidate?: any) => Promise<void>;
  writeConfigGuarded: (request: any, candidate?: any) => Promise<void>;
  applyConfigPatchGuarded: (request: any, candidate?: any) => Promise<void>;
  writeEnvFileGuarded: (request: any, candidate?: any) => Promise<void>;
  getOpenClawOwnership: (installFingerprint: string) => Promise<any>;
  listOpenClawOwnershipChanges: (installFingerprint: string) => Promise<any>;
  previewOpenClawCleanup: (request: any) => Promise<any>;
  runOpenClawCleanup: (request: any) => Promise<void>;
  runOpenClawDataCleanup: (request: any) => Promise<void>;
  previewCCClawUninstall: (request: any) => Promise<any>;
  prepareCCClawUninstall: (request: any) => Promise<void>;
  listOpenClawBackups: () => Promise<any[]>;
  getOpenClawBackupRoot: () => Promise<any>;
  deleteOpenClawBackup: (backupId: string) => Promise<void>;
  deleteAllOpenClawBackups: () => Promise<void>;
  runOpenClawManualBackup: () => Promise<void>;
  openOpenClawBackupDirectory: (targetPath?: string) => Promise<void>;
  openOpenClawWorkspace: () => Promise<void>;
  previewOpenClawRestore: (backupId: string) => Promise<any>;
  runOpenClawRestore: (backupId: string, scope: string) => Promise<void>;
  checkOpenClawUpgrade: () => Promise<any>;
  runOpenClawUpgrade: () => Promise<void>;
  getCCClawUpdateStatus: () => Promise<any>;
  checkCCClawUpdate: () => Promise<any>;
  downloadCCClawUpdate: () => Promise<void>;
  installCCClawUpdate: () => Promise<void>;
  openCCClawUpdateDownloadUrl: () => Promise<void>;
  checkCombinedUpdate: () => Promise<any>;
  runCombinedUpdate: () => Promise<void>;

  // Onboard
  onboard: (opts: any) => Promise<void>;

  // Gateway
  gatewayHealth: () => Promise<any>;
  getOpenClawRuntimeReconcileState: () => Promise<any>;
  gatewayForceRestart: () => Promise<void>;
  reloadGatewayAfterModelChange: () => Promise<void>;
  reloadGatewayAfterChannelChange: () => Promise<void>;
  reloadGatewayManual: () => Promise<void>;
  ensureGatewayRunning: (options?: any) => Promise<void>;
  onGatewayBootstrapState: (listener: (payload: any) => void) => () => void;

  // Status
  getStatus: () => Promise<any>;

  // Config
  readConfig: () => Promise<any>;
  readEnvFile: () => Promise<string>;

  // Doctor
  runDoctor: (options?: any) => Promise<any>;

  // Pairing
  pairingApprove: (channel: string, code: string, accountId?: string) => Promise<void>;
  pairingAddAllowFrom: (channel: string, senderId: string, accountId?: string) => Promise<void>;
  pairingAllowFromUsers: (channel: string, accountId?: string) => Promise<string[]>;
  pairingFeishuStatus: (accountIds: string[]) => Promise<any>;
  getFeishuRuntimeStatus: () => Promise<any>;
  pairingFeishuAccounts: (accountId?: string) => Promise<any[]>;
  pairingRemoveAllowFrom: (channel: string, senderId: string, accountId?: string) => Promise<void>;

  // Plugins
  installPlugin: (name: string, expectedPluginIds?: string[]) => Promise<void>;
  installPluginNpx: (url: string, expectedPluginIds?: string[]) => Promise<void>;
  repairIncompatiblePlugins: (options?: any) => Promise<void>;
  isPluginInstalledOnDisk: (pluginId: string) => Promise<boolean>;
  uninstallPlugin: (name: string) => Promise<void>;
  isFeishuOfficialPluginInstalled: () => Promise<boolean>;
  getFeishuOfficialPluginState: () => Promise<any>;
  ensureFeishuOfficialPluginReady: () => Promise<void>;
  validateFeishuCredentials: (appId: string, appSecret: string, domain?: string) => Promise<any>;
  getFeishuInstallerState: () => Promise<any>;
  startFeishuInstaller: () => Promise<void>;
  listenFeishuBotDiagnosticActivity: (accountId?: any, timeoutMs?: any, requestId?: any) => Promise<void>;
  cancelFeishuBotDiagnosticListen: (requestId: string) => Promise<void>;
  sendFeishuDiagnosticMessage: (request: any) => Promise<void>;
  sendFeishuInstallerInput: (sessionId: string, input: string) => Promise<void>;
  stopFeishuInstaller: () => Promise<void>;
  onFeishuInstallerEvent: (listener: (payload: any) => void) => () => void;
  getWeixinInstallerState: () => Promise<any>;
  startWeixinInstaller: () => Promise<void>;
  stopWeixinInstaller: () => Promise<void>;
  onWeixinInstallerEvent: (listener: (payload: any) => void) => () => void;
  listWeixinAccounts: () => Promise<any[]>;
  removeWeixinAccount: (accountId: string) => Promise<void>;

  // Channels
  channelsAdd: (channel: string, token: string) => Promise<void>;
  setupDingtalkOfficialChannel: (formData: Record<string, string>) => Promise<void>;
  getOfficialChannelStatus: (channelId: 'feishu' | 'dingtalk') => Promise<any>;
  repairOfficialChannel: (channelId: 'feishu' | 'dingtalk') => Promise<void>;
  getManagedChannelPluginStatus: (channelId: string) => Promise<any>;
  prepareManagedChannelPluginForSetup: (channelId: string) => Promise<void>;
  repairManagedChannelPlugin: (channelId: string) => Promise<void>;

  // Dashboard & Chat
  openDashboard: () => Promise<void>;
  getChatAvailability: () => Promise<any>;
  listChatSessions: () => Promise<any[]>;
  createChatSession: () => Promise<any>;
  createLocalChatSession: () => Promise<any>;
  getChatCapabilitySnapshot: () => Promise<any>;
  getChatSessionDebugSnapshot: (sessionId: string) => Promise<any>;
  listChatTraceEntries: (limit?: number) => Promise<any[]>;
  patchChatSessionModel: (request: any) => Promise<void>;
  getChatTranscript: (sessionId: string) => Promise<any>;
  sendChatMessage: (request: any) => Promise<void>;
  cancelChatMessage: () => Promise<void>;
  clearChatTranscript: (sessionId: string) => Promise<void>;
  onChatStream: (listener: (payload: any) => void) => () => void;

  // WeChat Work QR binding
  wecomQrGenerate: () => Promise<string>;
  wecomQrCheckResult: (scode: string) => Promise<any>;

  // Uninstall
  uninstallAll: () => Promise<void>;

  // OAuth
  checkOAuthComplete: (providerKey: string) => Promise<boolean>;
  getLatestOAuthUrl: () => Promise<string>;
  openOAuthUrl: (url?: string) => Promise<void>;
  inspectOAuthDependency: (authChoice: string) => Promise<any>;
  installOAuthDependency: (request: any) => Promise<void>;

  // Local models
  testLocalConnection: (input: any) => Promise<any>;
  scanLocalModels: (input: any) => Promise<any[]>;
  writeLocalModelEnv: (updates: Record<string, string>) => Promise<void>;
  ensureLocalAuthProfile: (input: any) => Promise<void>;
  clearModelAuthProfiles: (input: { providerIds: string[]; authStorePath?: string }) => Promise<void>;
  inspectModelAuthProfiles: (input: { providerIds: string[]; authStorePath?: string }) => Promise<any[]>;
  clearExternalProviderAuth: (input: { providerIds: string[] }) => Promise<void>;

  // Models center
  getModelCapabilities: () => Promise<any>;
  listModelCatalog: (query?: any) => Promise<any[]>;
  getModelStatus: (options?: any) => Promise<any>;
  getModelUpstreamState: () => Promise<any>;
  syncModelVerificationState: (input?: any) => Promise<void>;
  recordModelVerification: (input: { modelKey: string; verificationState: 'verified-available' | 'verified-unavailable' }) => Promise<void>;
  applyModelConfigViaUpstream: (request: any) => Promise<void>;
  validateProviderCredential: (input: any) => Promise<any>;
  applyModelConfig: (action: any) => Promise<void>;
  runModelAuth: (action: any) => Promise<void>;
  startModelOAuth: (request: { providerId: string; methodId: string; selectedExtraOption?: string; setDefault?: boolean }) => Promise<void>;
  cancelModelOAuth: () => Promise<void>;
  onOAuthState: (listener: (payload: any) => void) => () => void;
  onOAuthCode: (listener: (payload: any) => void) => () => void;
  onOAuthSuccess: (listener: (payload: any) => void) => () => void;
  onOAuthError: (listener: (payload: any) => void) => () => void;
  refreshModelData: (payload?: any) => Promise<void>;

  // Skills
  skillsList: () => Promise<any[]>;
  skillsInfo: (name: string) => Promise<any>;
  skillsToggle: (name: string, enabled: boolean) => Promise<void>;
  skillsUpdate: (payload: { skillKey: string; enabled?: boolean; apiKey?: string }) => Promise<void>;
  skillsUninstall: (name: string) => Promise<void>;
  skillsInstall: (name: string) => Promise<void>;
  clawhubSearch: (query: string, limit?: number) => Promise<any[]>;
  clawhubInstall: (slug: string) => Promise<void>;
  depsInstallBin: (bin: string) => Promise<void>;
  depsInstallSkillDeps: (skillName: string) => Promise<void>;
  onDepsInstallLog: (listener: (msg: string) => void) => () => void;
  depsCheckBrew: () => Promise<boolean>;
  depsInstallBrew: () => Promise<void>;

  // Agents - 使用严格类型（已修复 IPC-002）
  agentsCreate: (input: AgentCreateInput) => Promise<AgentConfig>;
  agentsGet: (id: string) => Promise<AgentConfig | null>;
  agentsGetAll: (filter?: AgentListFilter) => Promise<AgentConfig[]>;
  agentsUpdate: (id: string, input: AgentUpdateInput) => Promise<AgentConfig>;
  agentsDelete: (id: string) => Promise<boolean>;
  agentsSetStatus: (id: string, status: AgentStatus) => Promise<boolean>;
  agentsExists: (id: string) => Promise<boolean>;

  // RPA - Web RPA
  rpaWebCreateTask: (input: RpaTaskCreateInput) => Promise<RpaTask>;
  rpaWebGetTask: (taskId: string) => Promise<RpaTask | null>;
  rpaWebGetAllTasks: (filter?: RpaTaskListFilter) => Promise<RpaTask[]>;
  rpaWebUpdateTask: (taskId: string, input: RpaTaskUpdateInput) => Promise<RpaTask | null>;
  rpaWebDeleteTask: (taskId: string) => Promise<boolean>;
  rpaWebExecuteTask: (taskId: string) => Promise<RpaExecutionResult>;
  rpaWebStopTask: (taskId: string) => Promise<boolean>;

  // RPA - Desktop RPA
  rpaDesktopCreateTask: (input: RpaTaskCreateInput) => Promise<RpaTask>;
  rpaDesktopGetTask: (taskId: string) => Promise<RpaTask | null>;
  rpaDesktopGetAllTasks: (filter?: RpaTaskListFilter) => Promise<RpaTask[]>;
  rpaDesktopUpdateTask: (taskId: string, input: RpaTaskUpdateInput) => Promise<RpaTask | null>;
  rpaDesktopDeleteTask: (taskId: string) => Promise<boolean>;
  rpaDesktopExecuteTask: (taskId: string) => Promise<RpaExecutionResult>;
  rpaDesktopStopTask: (taskId: string) => Promise<boolean>;
  rpaDesktopCaptureScreen: (options: ScreenCaptureOptions) => Promise<string>;
  rpaDesktopRecognizeText: (imagePath: string, options?: OcrOptions) => Promise<OcrResult[]>;
  rpaDesktopFindElement: (options: ElementRecognitionOptions) => Promise<RecognizedElement[]>;
  rpaDesktopClick: (x: number, y: number, options?: { button?: 'left' | 'right' | 'middle'; double?: boolean }) => Promise<void>;
  rpaDesktopType: (text: string, options?: { delay?: number }) => Promise<void>;
  rpaDesktopGetWindows: (options?: WindowQueryOptions) => Promise<WindowInfo[]>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
