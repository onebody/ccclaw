import { ipcRenderer, contextBridge } from 'electron'
import type {
  OpenClawBackupRootInfo,
  OpenClawCleanupPreviewRequest,
  OpenClawCleanupRunRequest,
  OpenClawDataCleanupRunRequest,
} from '../../src/shared/openclaw-phase3'
import type {
  FeishuBotDiagnosticListenRequest,
  FeishuBotDiagnosticSendRequest,
} from '../../src/shared/feishu-diagnostics'
import type {
  AgentCreateInput,
  AgentUpdateInput,
  AgentListFilter,
  AgentStatus,
  AgentConfig,
  AgentIPCResponse,
} from '../../src/types/agent'
import type {
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  ScreenCaptureOptions,
  OcrOptions,
  ElementRecognitionOptions,
  WindowQueryOptions,
} from '../../src/types/rpa'

const OPEN_CONTACT_MODAL_CHANNEL = 'app:open-contact-modal'
const OPEN_MODELS_PAGE_CHANNEL = 'app:open-models-page'

function subscribeToChannel<T>(channel: string, listener: (payload: T) => void) {
  const wrapped = (_event: unknown, payload: T) => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => {
    ipcRenderer.removeListener(channel, wrapped)
  }
}

export const api = {
  // Platform
  platform: process.platform,
  quitApp: () => ipcRenderer.invoke('app:quit'),
  onOpenContactModal: (listener: () => void) =>
    subscribeToChannel<void>(OPEN_CONTACT_MODAL_CHANNEL, () => listener()),
  onOpenModelsPage: (listener: () => void) =>
    subscribeToChannel<void>(OPEN_MODELS_PAGE_CHANNEL, () => listener()),
  getOpenClawPaths: () => ipcRenderer.invoke('paths:openclaw:get'),

  // Environment
  checkNode: () => ipcRenderer.invoke('env:checkNode'),
  checkOpenClaw: () => ipcRenderer.invoke('env:checkOpenClaw'),
  prepareMacGitTools: () => ipcRenderer.invoke('env:prepareMacGitTools'),
  installNode: () => ipcRenderer.invoke('env:installNode'),
  resolveNodeInstallPlan: () => ipcRenderer.invoke('env:resolveNodeInstallPlan'),
  downloadNodeInstaller: (plan?: Record<string, any>) => ipcRenderer.invoke('env:downloadNodeInstaller', plan),
  inspectNodeInstaller: (installerPath: string) => ipcRenderer.invoke('env:inspectNodeInstaller', installerPath),
  installEnv: (opts: { needNode: boolean; needOpenClaw: boolean; nodeInstallerPath?: string; nodeInstallPlan?: Record<string, any> }) =>
    ipcRenderer.invoke('env:installEnv', opts),

  // Environment refresh
  refreshEnvironment: () => ipcRenderer.invoke('env:refresh'),
  waitForCommand: (command: string, args?: string[]) =>
    ipcRenderer.invoke('env:waitForCommand', command, args),

  // Command control
  cancelCommand: () => ipcRenderer.invoke('command:cancel'),
  cancelCommandDetailed: () => ipcRenderer.invoke('command:cancel-detailed'),
  cancelCommandDomain: (domain: string) => ipcRenderer.invoke('command:cancel-domain', domain),
  cancelCommands: (domains: string[]) => ipcRenderer.invoke('command:cancel-batch', domains),

  // Install
  installOpenClaw: () => ipcRenderer.invoke('install:openclaw'),
  discoverOpenClaw: () => ipcRenderer.invoke('openclaw:discover'),
  checkOpenClawLatestVersion: () => ipcRenderer.invoke('openclaw:latest:check'),
  ensureOpenClawBaselineBackup: (candidate: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:baseline-backup:ensure', candidate),
  skipOpenClawBaselineBackup: (candidate: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:baseline-backup:skip', candidate),
  getOpenClawBaselineBackupStatus: (installFingerprint: string) =>
    ipcRenderer.invoke('openclaw:baseline-backup:get-status', installFingerprint),
  markManagedOpenClawInstall: (installFingerprint: string) =>
    ipcRenderer.invoke('openclaw:managed:mark', installFingerprint),
  getOpenClawDataGuard: (candidate?: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:data-guard:get', candidate),
  prepareManagedOpenClawConfigWrite: (candidate?: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:config:prepare', candidate),
  writeConfigGuarded: (request: Record<string, any>, candidate?: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:config:guarded-write', request, candidate),
  applyConfigPatchGuarded: (request: Record<string, any>, candidate?: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:config:apply-patch', request, candidate),
  writeEnvFileGuarded: (request: Record<string, any>, candidate?: Record<string, any>) =>
    ipcRenderer.invoke('openclaw:env:guarded-write', request, candidate),
  getOpenClawOwnership: (installFingerprint: string) =>
    ipcRenderer.invoke('openclaw:ownership:get', installFingerprint),
  listOpenClawOwnershipChanges: (installFingerprint: string) =>
    ipcRenderer.invoke('openclaw:ownership:list-changes', installFingerprint),
  previewOpenClawCleanup: (request: OpenClawCleanupPreviewRequest) =>
    ipcRenderer.invoke('openclaw:cleanup:preview', request),
  runOpenClawCleanup: (request: OpenClawCleanupRunRequest) =>
    ipcRenderer.invoke('openclaw:cleanup:run', request),
  runOpenClawDataCleanup: (request: OpenClawDataCleanupRunRequest) =>
    ipcRenderer.invoke('openclaw:data-cleanup:run', request),
  previewCCClawUninstall: (request: OpenClawCleanupPreviewRequest) =>
    ipcRenderer.invoke('ccclaw:uninstall:preview', request),
  prepareCCClawUninstall: (request: OpenClawCleanupRunRequest) =>
    ipcRenderer.invoke('ccclaw:uninstall:prepare', request),
  listOpenClawBackups: () => ipcRenderer.invoke('openclaw:backup:list'),
  getOpenClawBackupRoot: (): Promise<OpenClawBackupRootInfo> => ipcRenderer.invoke('openclaw:backup:get-root'),
  deleteOpenClawBackup: (backupId: string) => ipcRenderer.invoke('openclaw:backup:delete', backupId),
  deleteAllOpenClawBackups: () => ipcRenderer.invoke('openclaw:backup:delete-all'),
  runOpenClawManualBackup: () => ipcRenderer.invoke('openclaw:backup:run-manual'),
  openOpenClawBackupDirectory: (targetPath?: string) => ipcRenderer.invoke('openclaw:backup:open-dir', targetPath),
  openOpenClawWorkspace: () => ipcRenderer.invoke('openclaw:open-workspace'),
  previewOpenClawRestore: (backupId: string) => ipcRenderer.invoke('openclaw:restore:preview', backupId),
  runOpenClawRestore: (backupId: string, scope: string) =>
    ipcRenderer.invoke('openclaw:restore:run', backupId, scope),
  checkOpenClawUpgrade: () => ipcRenderer.invoke('openclaw:upgrade:check'),
  runOpenClawUpgrade: () => ipcRenderer.invoke('openclaw:upgrade:run'),
  getCCClawUpdateStatus: () => ipcRenderer.invoke('ccclaw:update:status'),
  checkCCClawUpdate: () => ipcRenderer.invoke('ccclaw:update:check'),
  downloadCCClawUpdate: () => ipcRenderer.invoke('ccclaw:update:download'),
  installCCClawUpdate: () => ipcRenderer.invoke('ccclaw:update:install'),
  openCCClawUpdateDownloadUrl: () => ipcRenderer.invoke('ccclaw:update:open-download-url'),
  checkCombinedUpdate: () => ipcRenderer.invoke('combined:update:check'),
  runCombinedUpdate: () => ipcRenderer.invoke('combined:update:run'),

  // Onboard
  onboard: (opts: Record<string, any>) => ipcRenderer.invoke('setup:onboard', opts),

  // Gateway
  gatewayHealth: () => ipcRenderer.invoke('gateway:health'),
  getOpenClawRuntimeReconcileState: () => ipcRenderer.invoke('gateway:runtime-reconcile:state:get'),
  gatewayForceRestart: () => ipcRenderer.invoke('gateway:force-restart'),
  reloadGatewayAfterModelChange: () => ipcRenderer.invoke('gateway:reload-after-model-change'),
  reloadGatewayAfterChannelChange: () => ipcRenderer.invoke('gateway:reload-after-channel-change'),
  reloadGatewayManual: () => ipcRenderer.invoke('gateway:reload-manual'),
  ensureGatewayRunning: (options?: { skipRuntimePrecheck?: boolean; requestId?: string }) =>
    ipcRenderer.invoke('gateway:ensure-running', options),
  onGatewayBootstrapState: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('gateway:bootstrap:state', listener),

  // Status
  getStatus: () => ipcRenderer.invoke('status:get'),

  // Config
  readConfig: () => ipcRenderer.invoke('config:read'),
  readEnvFile: () => ipcRenderer.invoke('env:read'),

  // Doctor
  runDoctor: (options?: { fix?: boolean; nonInteractive?: boolean }) => ipcRenderer.invoke('doctor:run', options),

  // Pairing
  pairingApprove: (channel: string, code: string, accountId?: string) =>
    ipcRenderer.invoke('pairing:approve', channel, code, accountId),
  pairingAddAllowFrom: (channel: string, senderId: string, accountId?: string) =>
    ipcRenderer.invoke('pairing:addAllowFrom', channel, senderId, accountId),
  pairingAllowFromUsers: (channel: string, accountId?: string) =>
    ipcRenderer.invoke('pairing:allowFromUsers', channel, accountId),
  pairingFeishuStatus: (accountIds: string[]) => ipcRenderer.invoke('pairing:feishuStatus', accountIds),
  getFeishuRuntimeStatus: () => ipcRenderer.invoke('feishu:runtime-status'),
  pairingFeishuAccounts: (accountId?: string) => ipcRenderer.invoke('pairing:feishuAccounts', accountId),
  pairingRemoveAllowFrom: (channel: string, senderId: string, accountId?: string) =>
    ipcRenderer.invoke('pairing:removeAllowFrom', channel, senderId, accountId),

  // Plugins
  installPlugin: (name: string, expectedPluginIds?: string[]) => ipcRenderer.invoke('plugins:install', name, expectedPluginIds),
  installPluginNpx: (url: string, expectedPluginIds?: string[]) => ipcRenderer.invoke('plugins:installNpx', url, expectedPluginIds),
  repairIncompatiblePlugins: (
    options?: { scopePluginIds?: string[]; quarantineOfficialManagedPlugins?: boolean }
  ) =>
    ipcRenderer.invoke('plugins:repair-incompatible', options),
  isPluginInstalledOnDisk: (pluginId: string) => ipcRenderer.invoke('plugins:installed-on-disk', pluginId),
  uninstallPlugin: (name: string) => ipcRenderer.invoke('plugins:uninstall', name),
  isFeishuOfficialPluginInstalled: () => ipcRenderer.invoke('plugins:feishu-installed'),
  getFeishuOfficialPluginState: () => ipcRenderer.invoke('plugins:feishu-state'),
  ensureFeishuOfficialPluginReady: () => ipcRenderer.invoke('plugins:feishu-ensure-ready'),
  validateFeishuCredentials: (appId: string, appSecret: string, domain?: string) =>
    ipcRenderer.invoke('feishu:credentials:validate', appId, appSecret, domain),
  getFeishuInstallerState: () => ipcRenderer.invoke('feishu:installer:state:get'),
  startFeishuInstaller: () => ipcRenderer.invoke('feishu:installer:start'),
  listenFeishuBotDiagnosticActivity: (
    accountId?: FeishuBotDiagnosticListenRequest['accountId'],
    timeoutMs?: FeishuBotDiagnosticListenRequest['timeoutMs'],
    requestId?: FeishuBotDiagnosticListenRequest['requestId']
  ) =>
    ipcRenderer.invoke('feishu:diagnostics:listen', accountId, timeoutMs, requestId),
  cancelFeishuBotDiagnosticListen: (requestId: string) =>
    ipcRenderer.invoke('feishu:diagnostics:cancel-listen', requestId),
  sendFeishuDiagnosticMessage: (request: FeishuBotDiagnosticSendRequest) =>
    ipcRenderer.invoke('feishu:diagnostics:send', request),
  sendFeishuInstallerInput: (sessionId: string, input: string) =>
    ipcRenderer.invoke('feishu:installer:input', sessionId, input),
  stopFeishuInstaller: () => ipcRenderer.invoke('feishu:installer:stop'),
  onFeishuInstallerEvent: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('feishu:installer:event', listener),
  getWeixinInstallerState: () => ipcRenderer.invoke('weixin:installer:state:get'),
  startWeixinInstaller: () => ipcRenderer.invoke('weixin:installer:start'),
  stopWeixinInstaller: () => ipcRenderer.invoke('weixin:installer:stop'),
  onWeixinInstallerEvent: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('weixin:installer:event', listener),
  listWeixinAccounts: () => ipcRenderer.invoke('weixin:accounts:list'),
  removeWeixinAccount: (accountId: string) => ipcRenderer.invoke('weixin:accounts:remove', accountId),

  // Channels
  channelsAdd: (channel: string, token: string) => ipcRenderer.invoke('channels:add', channel, token),
  setupDingtalkOfficialChannel: (formData: Record<string, string>) =>
    ipcRenderer.invoke('channels:dingtalk:setup-official', formData),
  getOfficialChannelStatus: (channelId: 'feishu' | 'dingtalk') =>
    ipcRenderer.invoke('channels:official:status', channelId),
  repairOfficialChannel: (channelId: 'feishu' | 'dingtalk') =>
    ipcRenderer.invoke('channels:official:repair', channelId),
  getManagedChannelPluginStatus: (channelId: string) =>
    ipcRenderer.invoke('channels:managed:status', channelId),
  prepareManagedChannelPluginForSetup: (channelId: string) =>
    ipcRenderer.invoke('channels:managed:prepare', channelId),
  repairManagedChannelPlugin: (channelId: string) =>
    ipcRenderer.invoke('channels:managed:repair', channelId),

  // Dashboard
  openDashboard: () => ipcRenderer.invoke('dashboard:open'),
  getChatAvailability: () => ipcRenderer.invoke('chat:availability:get'),
  listChatSessions: () => ipcRenderer.invoke('chat:sessions:list'),
  createChatSession: () => ipcRenderer.invoke('chat:session:create'),
  createLocalChatSession: () => ipcRenderer.invoke('chat:session:create:local'),
  getChatCapabilitySnapshot: () => ipcRenderer.invoke('chat:capabilities:get'),
  getChatSessionDebugSnapshot: (sessionId: string) => ipcRenderer.invoke('chat:debug-snapshot:get', sessionId),
  listChatTraceEntries: (limit?: number) => ipcRenderer.invoke('chat:trace:list', limit),
  patchChatSessionModel: (request: Record<string, any>) => ipcRenderer.invoke('chat:session:model:patch', request),
  getChatTranscript: (sessionId: string) => ipcRenderer.invoke('chat:transcript:get', sessionId),
  sendChatMessage: (request: Record<string, any>) => ipcRenderer.invoke('chat:send', request),
  cancelChatMessage: () => ipcRenderer.invoke('chat:cancel'),
  clearChatTranscript: (sessionId: string) => ipcRenderer.invoke('chat:transcript:clear', sessionId),
  onChatStream: (listener: (payload: Record<string, any>) => void) => subscribeToChannel('chat:stream', listener),

  // WeChat Work QR binding
  wecomQrGenerate: () => ipcRenderer.invoke('wecom:qr:generate'),
  wecomQrCheckResult: (scode: string) => ipcRenderer.invoke('wecom:qr:check', scode),

  // Uninstall
  uninstallAll: () => ipcRenderer.invoke('uninstall:all'),

  // OAuth
  checkOAuthComplete: (providerKey: string) => ipcRenderer.invoke('check-oauth-complete', providerKey),
  getLatestOAuthUrl: () => ipcRenderer.invoke('oauth:latest-url:get'),
  openOAuthUrl: (url?: string) => ipcRenderer.invoke('oauth:url:open', url),
  inspectOAuthDependency: (authChoice: string) => ipcRenderer.invoke('oauth:dependency:inspect', authChoice),
  installOAuthDependency: (request: Record<string, any>) => ipcRenderer.invoke('oauth:dependency:install', request),

  // Local models
  testLocalConnection: (input: Record<string, any>) =>
    ipcRenderer.invoke('local-models:test-connection', input),
  scanLocalModels: (input: Record<string, any>) =>
    ipcRenderer.invoke('local-models:scan', input),
  writeLocalModelEnv: (updates: Record<string, string>) =>
    ipcRenderer.invoke('local-models:write-env', updates),
  ensureLocalAuthProfile: (input: Record<string, any>) =>
    ipcRenderer.invoke('local-models:ensure-auth', input),
  clearModelAuthProfiles: (input: { providerIds: string[]; authStorePath?: string }) =>
    ipcRenderer.invoke('local-models:clear-auth-profiles', input),
  inspectModelAuthProfiles: (input: { providerIds: string[]; authStorePath?: string }) =>
    ipcRenderer.invoke('local-models:inspect-auth-profiles', input),
  clearExternalProviderAuth: (input: { providerIds: string[] }) =>
    ipcRenderer.invoke('local-models:clear-external-auth', input),

  // Models center
  getModelCapabilities: () => ipcRenderer.invoke('models:capabilities:get'),
  listModelCatalog: (query?: Record<string, any>) => ipcRenderer.invoke('models:catalog:list', query),
  getModelStatus: (options?: Record<string, any>) => ipcRenderer.invoke('models:status:get', options),
  getModelUpstreamState: () => ipcRenderer.invoke('models:upstream-state:get'),
  syncModelVerificationState: (input?: { statusData?: Record<string, any> | null }) =>
    ipcRenderer.invoke('models:verification:sync', input),
  recordModelVerification: (input: {
    modelKey: string
    verificationState: 'verified-available' | 'verified-unavailable'
  }) => ipcRenderer.invoke('models:verification:record', input),
  applyModelConfigViaUpstream: (request: Record<string, any>) => ipcRenderer.invoke('models:upstream-write:apply', request),
  validateProviderCredential: (input: Record<string, any>) => ipcRenderer.invoke('models:provider:validate', input),
  applyModelConfig: (action: Record<string, any>) => ipcRenderer.invoke('models:config:apply', action),
  runModelAuth: (action: Record<string, any>) => ipcRenderer.invoke('models:auth:run', action),
  startModelOAuth: (request: { providerId: string; methodId: string; selectedExtraOption?: string; setDefault?: boolean }) =>
    ipcRenderer.invoke('models:oauth:start', request),
  cancelModelOAuth: () => ipcRenderer.invoke('models:oauth:cancel'),
  onOAuthState: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('oauth:state', listener),
  onOAuthCode: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('oauth:code', listener),
  onOAuthSuccess: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('oauth:success', listener),
  onOAuthError: (listener: (payload: Record<string, any>) => void) =>
    subscribeToChannel('oauth:error', listener),
  refreshModelData: (payload?: Record<string, any>) => ipcRenderer.invoke('models:refresh', payload),

  // Skills
  skillsList: () => ipcRenderer.invoke('skills:list'),
  skillsInfo: (name: string) => ipcRenderer.invoke('skills:info', name),
  skillsToggle: (name: string, enabled: boolean) => ipcRenderer.invoke('skills:toggle', name, enabled),
  skillsUpdate: (payload: { skillKey: string; enabled?: boolean; apiKey?: string }) =>
    ipcRenderer.invoke('skills:update', payload),
  skillsUninstall: (name: string) => ipcRenderer.invoke('skills:uninstall', name),
  skillsInstall: (name: string) => ipcRenderer.invoke('skills:install', name),
  clawhubSearch: (query: string, limit?: number) => ipcRenderer.invoke('clawhub:search', query, limit),
  clawhubInstall: (slug: string) => ipcRenderer.invoke('clawhub:install', slug),
  depsInstallBin: (bin: string) => ipcRenderer.invoke('deps:installBin', bin),
  depsInstallSkillDeps: (skillName: string) => ipcRenderer.invoke('deps:installSkillDeps', skillName),
  onDepsInstallLog: (listener: (msg: string) => void) => subscribeToChannel('deps:install:log', listener),
  depsCheckBrew: () => ipcRenderer.invoke('deps:checkBrew'),
  depsInstallBrew: () => ipcRenderer.invoke('deps:installBrew'),

  // Agents
  agentsCreate: (input: AgentCreateInput) => ipcRenderer.invoke('agent:create', input),
  agentsGet: (id: string) => ipcRenderer.invoke('agent:get', id),
  agentsGetAll: (filter?: AgentListFilter) => ipcRenderer.invoke('agent:getAll', filter),
  agentsUpdate: (id: string, input: AgentUpdateInput) => ipcRenderer.invoke('agent:update', id, input),
  agentsDelete: (id: string) => ipcRenderer.invoke('agent:delete', id),
  agentsSetStatus: (id: string, status: AgentStatus) => ipcRenderer.invoke('agent:setStatus', id, status),
  agentsExists: (id: string) => ipcRenderer.invoke('agent:exists', id),

  // RPA - Web RPA
  rpaWebCreateTask: (input: RpaTaskCreateInput) => ipcRenderer.invoke('rpa:web:createTask', input),
  rpaWebGetTask: (taskId: string) => ipcRenderer.invoke('rpa:web:getTask', taskId),
  rpaWebGetAllTasks: (filter?: RpaTaskListFilter) => ipcRenderer.invoke('rpa:web:getAllTasks', filter),
  rpaWebUpdateTask: (taskId: string, input: RpaTaskUpdateInput) => ipcRenderer.invoke('rpa:web:updateTask', taskId, input),
  rpaWebDeleteTask: (taskId: string) => ipcRenderer.invoke('rpa:web:deleteTask', taskId),
  rpaWebExecuteTask: (taskId: string) => ipcRenderer.invoke('rpa:web:executeTask', taskId),
  rpaWebStopTask: (taskId: string) => ipcRenderer.invoke('rpa:web:stopTask', taskId),

  // RPA - Desktop RPA
  rpaDesktopCreateTask: (input: RpaTaskCreateInput) => ipcRenderer.invoke('rpa:desktop:createTask', input),
  rpaDesktopGetTask: (taskId: string) => ipcRenderer.invoke('rpa:desktop:getTask', taskId),
  rpaDesktopGetAllTasks: (filter?: RpaTaskListFilter) => ipcRenderer.invoke('rpa:desktop:getAllTasks', filter),
  rpaDesktopUpdateTask: (taskId: string, input: RpaTaskUpdateInput) => ipcRenderer.invoke('rpa:desktop:updateTask', taskId, input),
  rpaDesktopDeleteTask: (taskId: string) => ipcRenderer.invoke('rpa:desktop:deleteTask', taskId),
  rpaDesktopExecuteTask: (taskId: string) => ipcRenderer.invoke('rpa:desktop:executeTask', taskId),
  rpaDesktopStopTask: (taskId: string) => ipcRenderer.invoke('rpa:desktop:stopTask', taskId),
  rpaDesktopCaptureScreen: (options: ScreenCaptureOptions) => ipcRenderer.invoke('rpa:desktop:captureScreen', options),
  rpaDesktopRecognizeText: (imagePath: string, options?: OcrOptions) => ipcRenderer.invoke('rpa:desktop:recognizeText', imagePath, options),
  rpaDesktopFindElement: (options: ElementRecognitionOptions) => ipcRenderer.invoke('rpa:desktop:findElement', options),
  rpaDesktopClick: (x: number, y: number, options?: { button?: 'left' | 'right' | 'middle'; double?: boolean }) => ipcRenderer.invoke('rpa:desktop:click', x, y, options),
  rpaDesktopType: (text: string, options?: { delay?: number }) => ipcRenderer.invoke('rpa:desktop:type', text, options),
  rpaDesktopGetWindows: (options?: WindowQueryOptions) => ipcRenderer.invoke('rpa:desktop:getWindows', options),

  // Workspace
  workspaceList: () => ipcRenderer.invoke('workspace:list'),
  workspaceGet: (id: string) => ipcRenderer.invoke('workspace:get', id),
  workspaceCreate: (input: import('../../src/types/workspace').WorkspaceCreateInput) =>
    ipcRenderer.invoke('workspace:create', input),
  workspaceUpdate: (id: string, input: import('../../src/types/workspace').WorkspaceUpdateInput) =>
    ipcRenderer.invoke('workspace:update', id, input),
  workspaceDelete: (id: string) => ipcRenderer.invoke('workspace:delete', id),
  workspaceActivate: (id: string) => ipcRenderer.invoke('workspace:activate', id),
  workspaceGetActive: () => ipcRenderer.invoke('workspace:getActive'),
  workspaceValidate: (path: string) => ipcRenderer.invoke('workspace:validate', path),
  workspaceOpenDialog: () => ipcRenderer.invoke('workspace:openDialog'),

  // Task
  taskList: (filter?: import('../../src/types/workspace').TaskListFilter) =>
    ipcRenderer.invoke('task:list', filter),
  taskGet: (id: string) => ipcRenderer.invoke('task:get', id),
  taskCreate: (input: import('../../src/types/workspace').TaskCreateInput) =>
    ipcRenderer.invoke('task:create', input),
  taskUpdate: (id: string, input: import('../../src/types/workspace').TaskUpdateInput) =>
    ipcRenderer.invoke('task:update', id, input),
  taskDelete: (id: string) => ipcRenderer.invoke('task:delete', id),
  taskStart: (id: string) => ipcRenderer.invoke('task:start', id),
  taskComplete: (id: string) => ipcRenderer.invoke('task:complete', id),
  taskFail: (id: string, notes: string) => ipcRenderer.invoke('task:fail', id, notes),
  taskCancel: (id: string) => ipcRenderer.invoke('task:cancel', id),
  taskListByWorkspace: (workspaceId: string) => ipcRenderer.invoke('task:listByWorkspace', workspaceId),

  // Session
  sessionListByTask: (taskId: string) => ipcRenderer.invoke('session:listByTask', taskId),
  sessionGet: (id: string) => ipcRenderer.invoke('session:get', id),
  sessionCreate: (taskId: string, title?: string) => ipcRenderer.invoke('session:create', taskId, title),
  sessionUpdate: (id: string, input: Partial<import('../../src/types/workspace').ChatSession>) =>
    ipcRenderer.invoke('session:update', id, input),
  sessionDelete: (id: string) => ipcRenderer.invoke('session:delete', id),
  messageListBySession: (sessionId: string) => ipcRenderer.invoke('message:listBySession', sessionId),
  messageSend: (sessionId: string, content: string) => ipcRenderer.invoke('message:send', sessionId, content),

  // Artifact
  artifactListByTask: (taskId: string) => ipcRenderer.invoke('artifact:listByTask', taskId),
  artifactAdd: (artifact: Omit<import('../../src/types/workspace').Artifact, 'id' | 'createdAt'>) =>
    ipcRenderer.invoke('artifact:add', artifact),
  artifactDelete: (id: string) => ipcRenderer.invoke('artifact:delete', id),
}

contextBridge.exposeInMainWorld('api', api)
