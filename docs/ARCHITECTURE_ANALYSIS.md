# Ccclaw 项目架构分析报告

> 生成日期：2026-04-03  
> 项目版本：2.2.0

---

## 目录

- [一、项目概述](#一项目概述)
- [二、架构模式分析](#二架构模式分析)
- [三、核心组件与模块关系](#三核心组件与模块关系)
- [四、数据流模式](#四数据流模式)
- [五、IPC 通信模式](#五ipc-通信模式)
- [六、状态管理方式](#六状态管理方式)
- [七、配置管理模式](#七配置管理模式)
- [八、技能系统架构](#八技能系统架构)
- [九、CLI 集成模式](#九cli-集成模式)
- [十、"CCClaw" 出现位置完整清单](#十ccclaw-出现位置完整清单)

---

## 一、项目概述

**Ccclaw** 是一个基于 Electron 的桌面应用程序，作为 OpenClaw CLI 的图形化管理工具，提供可视化的配置、监控和管理功能。

### 项目基本信息

| 属性 | 值 |
|------|-----|
| **包名** | `ccclaw-lite` |
| **产品名** | Ccclaw |
| **版本** | 2.2.0 |
| **技术栈** | Electron + React + TypeScript + Vite + Mantine UI |
| **许可证** | Apache-2.0 |

### 核心功能

- **环境自检** — 自动检测 Node.js 和 OpenClaw CLI，缺失时自动安装
- **支持 OpenClaw 全量模型** — 支持接入 OpenClaw 的所有模型，也支持自定义添加
- **IM 插件接入** — 扫码一键接入飞书、微信、企业微信、钉钉、QQ
- **功能面板** — 实时监控网关状态、一键重启、修复网关
- **Skills 管理** — 管理各个来源的 skill
- **数据备份** — 提供自动备份和手动备份
- **多平台支持** — 支持 macOS、Windows（开发中）

---

## 二、架构模式分析

### 2.1 主架构模式：分层架构 + Electron IPC 桥接

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染进程 (Renderer)                       │
│         React + Mantine UI + React Router                   │
├─────────────────────────────────────────────────────────────┤
│                    共享业务逻辑层                             │
│         平台无关的 TypeScript 模块 (src/shared/*)            │
├─────────────────────────────────────────────────────────────┤
│                    主进程 (Main Process)                     │
│         Electron 主进程 + CLI 编排层                         │
├─────────────────────────────────────────────────────────────┤
│                    外部 CLI (OpenClaw)                       │
│         Node.js CLI 工具，用于 AI 网关管理                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 辅助设计模式

| 模式 | 应用场景 | 说明 |
|------|----------|------|
| **命令模式** | CLI 命令执行封装 | 将 CLI 调用封装为结构化操作 |
| **仓库模式** | 数据存储 | 配置、聊天会话、模型状态的持久化 |
| **观察者模式** | IPC 事件订阅 | 实现渲染进程与主进程的实时通信 |
| **网关模式** | CLI 抽象层 | 屏蔽底层命令复杂性，提供统一接口 |

### 2.3 技术栈详情

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^33.2.0 |
| 前端框架 | React | ^18.3.1 |
| 类型系统 | TypeScript | ^5.4.2 |
| 构建工具 | Vite | ^5.4.11 |
| UI 组件库 | Mantine | 8.3.16 |
| 样式方案 | Tailwind CSS | ^3.4.15 |
| 打包工具 | electron-builder | ^24.13.3 |

---

## 三、核心组件与模块关系

### 3.1 组件架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                         渲染进程                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ App.tsx  │  │  Pages/  │  │Components│  │   Lib/   │         │
│  │ (路由)   │──│Dashboard │──│  Modals  │──│ Helpers  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       └─────────────┴─────────────┴─────────────┘                │
│                           │                                       │
│                window.api (Preload 桥接)                          │
└───────────────────────────┼──────────────────────────────────────┘
                            │ IPC
┌───────────────────────────┼──────────────────────────────────────┐
│                         主进程                                     │
│  ┌──────────┐  ┌──────────┴─────────┐  ┌──────────┐             │
│  │ index.ts │──│  ipc-handlers.ts   │──│  cli.ts  │             │
│  │ (窗口)   │  │  (IPC 调度器)       │  │(CLI封装) │             │
│  └──────────┘  └────────────────────┘  └────┬─────┘             │
│                                              │                    │
│  ┌───────────────────────────────────────────┴────────────────┐  │
│  │                    领域服务层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │  │
│  │  │ 网关生命周期 │ │ 模型配置    │ │ 渠道插件    │           │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │  │
│  │  │ 技能管理    │ │ 聊天服务    │ │ 更新编排    │           │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │   OpenClaw CLI (npm)   │
               └────────────────────────┘
```

### 3.2 核心模块职责

#### 主进程模块

| 模块分类 | 文件位置 | 职责 |
|----------|----------|------|
| **核心生命周期** | `electron/main/index.ts` | 窗口管理、应用生命周期、系统托盘 |
| **窗口管理** | `electron/main/window-lifecycle.ts` | 窗口创建、显示、隐藏 |
| **应用清理** | `electron/main/app-exit-cleanup.ts` | 退出时的清理操作 |
| **CLI 集成** | `electron/main/cli.ts` | 命令执行、进程管理 |
| **进程控制** | `electron/main/cli-process.ts` | stdio 处理、超时控制 |
| **命令控制** | `electron/main/command-control.ts` | 命令取消、域管理 |
| **网关管理** | `electron/main/gateway-lifecycle-controller.ts` | 网关启动/停止/重启 |
| **模型管理** | `electron/main/openclaw-model-config.ts` | 模型配置、状态查询 |
| **渠道管理** | `electron/main/managed-channel-plugin-lifecycle.ts` | IM 渠道插件生命周期 |
| **认证** | `electron/main/openclaw-auth-orchestrator.ts` | OAuth 流程、认证编排 |
| **备份** | `electron/main/openclaw-backup-index.ts` | 备份索引管理 |
| **更新** | `electron/main/ccclaw-update-service.ts` | Ccclaw 自动更新 |

#### 渲染进程模块

| 模块分类 | 文件位置 | 职责 |
|----------|----------|------|
| **应用入口** | `src/App.tsx` | 应用状态机、路由、向导编排 |
| **仪表盘** | `src/pages/Dashboard.tsx` | 主控制面板 |
| **模型页** | `src/pages/ModelsPage.tsx` | 模型配置界面 |
| **渠道页** | `src/pages/ChannelsPage.tsx` | IM 渠道配置 |
| **聊天页** | `src/pages/ChatPage.tsx` | 聊天界面 |
| **设置页** | `src/pages/SettingsPage.tsx` | 设置界面 |
| **技能页** | `src/pages/SkillsPage.tsx` | 技能管理界面 |

#### 共享模块

| 模块 | 文件位置 | 职责 |
|------|----------|------|
| **运行时状态** | `src/shared/gateway-runtime-state.ts` | 网关状态定义 |
| **诊断** | `src/shared/gateway-runtime-diagnostics.ts` | 运行时诊断逻辑 |
| **策略** | `src/shared/runtime-policy.ts` | 超时策略、轮询配置 |
| **渠道注册** | `src/shared/managed-channel-plugin-registry.ts` | 渠道插件定义 |
| **阶段定义** | `src/shared/openclaw-phase*.ts` | 安装阶段类型定义 |

---

## 四、数据流模式

### 4.1 请求-响应流 (IPC)

```
渲染进程                    主进程                      CLI进程
   │                         │                           │
   │ window.api.getModelStatus()                        │
   │────────────────────────>│                           │
   │                         │ runCli(['models','status'])│
   │                         │──────────────────────────>│
   │                         │                           │
   │                         │     { stdout: JSON }      │
   │                         │<──────────────────────────│
   │                         │ parseJsonFromOutput()     │
   │ { ok: true, data: {} }  │                           │
   │<────────────────────────│                           │
```

### 4.2 流式数据流 (聊天)

```
渲染进程                    主进程                      CLI进程
   │                         │                           │
   │ window.api.sendChatMessage()                       │
   │────────────────────────>│                           │
   │                         │ runCliStreaming()         │
   │                         │──────────────────────────>│
   │                         │                           │
   │                         │   onStdout chunks         │
   │                         │<──────────────────────────│
   │ event.sender.send('chat:stream')                   │
   │<────────────────────────│                           │
   │  (多个流事件)            │                           │
   │<────────────────────────│                           │
```

### 4.3 状态同步模式

应用使用**基于轮询的状态同步**模式：

```typescript
// 轮询间隔示例
setInterval(fetchGatewayStatus, 10000)  // 网关状态每 10 秒
setInterval(fetchConfig, 30000)          // 配置每 30 秒
```

---

## 五、IPC 通信模式

### 5.1 通信类型

| 类型 | 模式 | 示例场景 |
|------|------|----------|
| **请求-响应** | `ipcRenderer.invoke()` / `ipcMain.handle()` | 配置读取、模型状态查询 |
| **单向事件** | `ipcRenderer.send()` / `ipcMain.on()` | 应用退出请求 |
| **主进程推送** | `event.sender.send()` / `ipcRenderer.on()` | 聊天流、OAuth 状态更新 |

### 5.2 Preload 桥接 API

```typescript
export const api = {
  // 平台信息
  platform: process.platform,
  quitApp: () => ipcRenderer.invoke('app:quit'),
  
  // 环境操作
  checkNode: () => ipcRenderer.invoke('env:checkNode'),
  checkOpenClaw: () => ipcRenderer.invoke('env:checkOpenClaw'),
  
  // 网关操作
  gatewayHealth: () => ipcRenderer.invoke('gateway:health'),
  ensureGatewayRunning: (options) => 
    ipcRenderer.invoke('gateway:ensure-running', options),
  
  // 模型操作
  getModelStatus: (options) => 
    ipcRenderer.invoke('models:status:get', options),
  listModelCatalog: (query) => 
    ipcRenderer.invoke('models:catalog:list', query),
  
  // 聊天操作
  sendChatMessage: (request) => 
    ipcRenderer.invoke('chat:send', request),
  onChatStream: (listener) => 
    subscribeToChannel('chat:stream', listener),
  
  // ... 100+ 更多 API 方法
}
```

### 5.3 命令控制域

系统实现了基于域的命令取消机制：

```typescript
const DEFAULT_CANCEL_DOMAINS = [
  'env-setup',      // 环境安装
  'oauth',          // OAuth 流程
  'chat',           // 聊天操作
  'plugin-install', // 插件安装
  'config-write',   // 配置写入
  'gateway',        // 网关操作
  'upgrade',        // 升级操作
  'models',         // 模型操作
  'capabilities',   // 能力查询
  'env',            // 环境变量
  'feishu-installer', // 飞书安装器
  'weixin-installer', // 微信安装器
  'global',         // 全局操作
]
```

---

## 六、状态管理方式

### 6.1 渲染进程状态

使用 **React hooks 本地状态管理**（无 Redux/Zustand）：

```typescript
// Dashboard.tsx 示例
const [gateway, setGateway] = useState<GatewayStatus>({ running: false })
const [config, setConfig] = useState<Record<string, any> | null>(null)
const [modelStatus, setModelStatus] = useState<Record<string, any> | null>(null)
const [channels, setChannels] = useState<ChannelInfo[]>([])
const [catalog, setCatalog] = useState<CatalogModel[]>([])
```

### 6.2 主进程持久化存储

| 存储 | 文件 | 持久化位置 | 用途 |
|------|------|------------|------|
| **聊天记录** | `ccclaw-chat-store.ts` | `~/.ccclaw-lite/chat/transcripts.json` | 本地聊天会话持久化 |
| **模型验证** | `model-verification-store.ts` | JSON 文件 | 模型可用性验证状态 |
| **运行时协调** | `openclaw-runtime-reconcile.ts` | JSON 文件 | 运行时状态协调 |
| **所有权** | `openclaw-ownership-store.ts` | JSON 文件 | 安装所有权追踪 |
| **思考兼容** | `chat-thinking-compat-store.ts` | JSON 文件 | 思考模式兼容状态 |

### 6.3 存储模式示例

```typescript
interface CCClawChatStore {
  version: 3
  sessions: StoredChatSessionRecord[]
}

async function loadStore(): Promise<CCClawChatStore> {
  try {
    const raw = await readFile(resolveStorePath(), 'utf8')
    const parsed = JSON.parse(raw)
    // 迁移和清理逻辑
    return migratedStore
  } catch {
    return { version: STORE_VERSION, sessions: [] }
  }
}

async function saveStore(store: CCClawChatStore): Promise<void> {
  await atomicWriteJson(storePath, store, { 
    description: '聊天 transcript 缓存' 
  })
}
```

---

## 七、配置管理模式

### 7.1 配置层级

```
┌─────────────────────────────────────────────────────────────┐
│  OpenClaw 配置 (~/.openclaw/config.json)                    │
│  • 模型设置                                                  │
│  • 渠道配置                                                  │
│  • 插件设置                                                  │
│  • 网关设置                                                  │
├─────────────────────────────────────────────────────────────┤
│  环境文件 (~/.openclaw/.env)                                │
│  • API 密钥                                                  │
│  • 密钥                                                      │
│  • 提供商凭证                                                │
├─────────────────────────────────────────────────────────────┤
│  Ccclaw 用户数据 (~/.ccclaw-lite/)                            │
│  • 聊天记录                                                  │
│  • 模型验证状态                                              │
│  • 运行时协调状态                                            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 受保护的配置写入

系统实现了**受保护写入模式**：

```typescript
// 配置写入流程
ipcMain.handle('openclaw:config:guarded-write', (_e, request, candidate) =>
  guardedWriteConfig(request, candidate)
)

// 受保护写入步骤：
// 1. 验证候选安装所有权
// 2. 检查数据保护条件
// 3. 应用配置差异
// 4. 如需要触发网关重载
```

### 7.3 配置差异计算

```typescript
// 计算最小差异以实现安全配置更新
export function computeConfigDiff(
  before: Record<string, any>,
  after: Record<string, any>
): ConfigDiffResult {
  // 返回最小变更集
}
```

---

## 八、技能系统架构

### 8.1 技能系统概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        技能系统                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              技能来源                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ 内置清单    │  │ 工作区      │  │ ClawHub 注册表      │  │   │
│  │  │ (Manifest)  │  │(~/.openclaw │  │ (npx clawhub)       │  │   │
│  │  │             │  │  /skills)   │  │                     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              技能生命周期                                     │   │
│  │  发现 → 安装 → 配置 → 启用/禁用 → 移除                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 托管渠道插件

```typescript
const MANAGED_CHANNEL_PLUGIN_RECORDS = [
  {
    channelId: 'feishu',
    pluginId: 'openclaw-lark',
    cleanupPluginIds: ['feishu', 'feishu-openclaw-plugin', 'openclaw-lark'],
    smokeTestPolicy: 'diagnostic-only',
  },
  {
    channelId: 'wecom',
    pluginId: 'wecom-openclaw-plugin',
    npxSpecifier: '@wecom/wecom-openclaw-cli',
  },
  {
    channelId: 'dingtalk',
    pluginId: 'dingtalk-connector',
    packageName: '@dingtalk-real-ai/dingtalk-connector',
  },
  {
    channelId: 'qqbot',
    pluginId: 'openclaw-qqbot',
    packageName: '@tencent-connect/openclaw-qqbot@latest',
  },
]
```

### 8.3 技能规范化

```typescript
interface NormalizedOpenClawSkillEntry {
  name: string
  description: string
  source: string           // 'openclaw-bundled', 'openclaw-workspace', 等
  eligible: boolean
  disabled: boolean
  skillKey: string
  configKeys?: string[]
  missing?: {
    bins: string[]         // 缺失的二进制依赖
    env: string[]          // 缺失的环境变量
    config: string[]       // 缺失的配置键
  }
  install?: Array<{        // 安装步骤
    id: string
    kind: string
    label: string
    bins: string[]
  }>
}
```

---

## 九、CLI 集成模式

### 9.1 CLI 包装架构

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLI 集成层                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      cli.ts (主入口)                          │ │
│  │  • runCli() - 基本命令执行                                    │ │
│  │  • runCliStreaming() - 流式输出支持                           │ │
│  │  • runShell() - 通用 shell 命令                               │ │
│  │  • runDirect() - 直接进程生成 (无 shell)                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────────┐ │
│  │                  支持模块                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │ │
│  │  │ openclaw-spawn  │  │ cli-process.ts  │  │ command-      │ │ │
│  │  │ 命令解析        │  │ stdio 处理      │  │ control.ts    │ │ │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 9.2 命令执行流程

```typescript
export async function runCli(
  args: string[],
  timeout = MAIN_RUNTIME_POLICY.cli.defaultCommandTimeoutMs,
  controlDomain?: CommandControlDomain
): Promise<CliResult> {
  return runCliStreaming(args, {
    timeout,
    controlDomain: resolveCommandControlDomain(args, controlDomain),
  })
}

// 域解析
function resolveCommandControlDomain(args: string[], preferredDomain?) {
  const command = args[0]?.toLowerCase()
  if (command === 'gateway' || command === 'health') return 'gateway'
  if (command === 'plugins' || command === 'skills') return 'plugin-install'
  if (command === 'chat') return 'chat'
  if (command === 'models') return 'models'
  // ...
  return 'global'
}
```

### 9.3 环境处理

CLI 包装器处理复杂的环境场景：

- **Node.js 运行时发现**：多来源（shell、nvm、fnm、volta、mise）
- **PATH 管理**：注入 Node 二进制目录
- **镜像回退**：中国区 NPM 注册表镜像
- **权限自动修复**：检测并修复权限问题

---

## 十、"CCClaw" 出现位置完整清单

### 10.1 统计概览

| 指标 | 值 |
|------|-----|
| **总出现次数** | 154 次 |
| **涉及文件数** | 16 个核心文件 |
| **主要类别** | 类型定义、更新服务、UI 组件、IPC 通信 |

### 10.2 按文件分类

#### 类型定义文件

| 文件路径 | 出现次数 | 用途 |
|----------|----------|------|
| `src/types/electron.d.ts` | 24 | 类型定义：更新状态、错误码、API 接口 |
| `src/shared/openclaw-phase4.ts` | 12 | 导出类型：更新状态、操作结果 |

#### 更新服务模块

| 文件路径 | 出现次数 | 用途 |
|----------|----------|------|
| `electron/main/ccclaw-update-service.ts` | 24 | Ccclaw 自动更新服务实现 |
| `electron/main/combined-update-orchestrator.ts` | 8 | 组合更新编排器 |
| `electron/main/__tests__/combined-update-orchestrator.test.ts` | 24 | 更新服务测试 |

#### UI 组件

| 文件路径 | 出现次数 | 用途 |
|----------|----------|------|
| `src/components/CCClawUpdateDialog.tsx` | 12 | Ccclaw 更新对话框组件 |
| `src/components/UpdateCenter.tsx` | 10 | 更新中心组件 |
| `src/components/CleanupDialog.tsx` | 2 | 清理对话框（卸载功能） |
| `src/components/AboutModal.tsx` | 1 | 关于对话框（版本检查） |

#### IPC 通信

| 文件路径 | 出现次数 | 用途 |
|----------|----------|------|
| `electron/main/ipc-handlers.ts` | 12 | IPC 处理器注册 |
| `electron/preload/index.ts` | 7 | Preload API 暴露 |
| `electron/preload/index.test.ts` | 5 | Preload 测试 |

#### 其他

| 文件路径 | 出现次数 | 用途 |
|----------|----------|------|
| `electron/main/ccclaw-chat-store.ts` | 5 | 聊天存储接口定义 |
| `electron/main/openclaw-cleanup-service.ts` | 4 | 清理服务 |
| `electron/main/openclaw-cleanup-planner.ts` | 3 | 清理计划器 |
| `CONTRIBUTING.md` | 1 | 贡献指南文档 |

### 10.3 详细出现位置

#### 类型定义

| 文件 | 行号 | 代码上下文 |
|------|------|------------|
| `src/types/electron.d.ts` | 1296 | `type CCClawUpdateStatusState =` |
| `src/types/electron.d.ts` | 1307 | `type CCClawUpdateErrorCode =` |
| `src/types/electron.d.ts` | 1317 | `interface CCClawUpdateStatus {` |
| `src/types/electron.d.ts` | 1335 | `interface CCClawUpdateActionResult {` |
| `src/types/electron.d.ts` | 1344 | `interface CCClawUpdateOpenDownloadResult` |
| `src/types/electron.d.ts` | 1635 | `previewCCClawUninstall: (...) => Promise<...>` |
| `src/types/electron.d.ts` | 1636 | `prepareCCClawUninstall: (...) => Promise<...>` |
| `src/types/electron.d.ts` | 1649 | `getCCClawUpdateStatus: () => Promise<CCClawUpdateStatus>` |
| `src/types/electron.d.ts` | 1650 | `checkCCClawUpdate: () => Promise<CCClawUpdateStatus>` |
| `src/types/electron.d.ts` | 1651 | `downloadCCClawUpdate: () => Promise<CCClawUpdateActionResult>` |
| `src/types/electron.d.ts` | 1652 | `installCCClawUpdate: () => Promise<CCClawUpdateActionResult>` |
| `src/types/electron.d.ts` | 1653 | `openCCClawUpdateDownloadUrl: () => Promise<...>` |

#### 更新服务

| 文件 | 行号 | 代码上下文 |
|------|------|------------|
| `electron/main/ccclaw-update-service.ts` | 3-6 | 类型导入 |
| `electron/main/ccclaw-update-service.ts` | 19 | `let currentStatus: CCClawUpdateStatus` |
| `electron/main/ccclaw-update-service.ts` | 187 | `function classifyUpdaterError(): CCClawUpdateErrorCode` |
| `electron/main/ccclaw-update-service.ts` | 199 | `function explainUpdaterError(code: CCClawUpdateErrorCode, ...)` |
| `electron/main/ccclaw-update-service.ts` | 206 | `function cloneStatus(): CCClawUpdateStatus` |
| `electron/main/ccclaw-update-service.ts` | 214 | `function setStatus(patch: Partial<CCClawUpdateStatus>)` |
| `electron/main/ccclaw-update-service.ts` | 403 | `async function ensureUpdaterAvailability(): Promise<CCClawUpdateStatus>` |
| `electron/main/ccclaw-update-service.ts` | 436 | `export async function getCCClawUpdateStatus()` |
| `electron/main/ccclaw-update-service.ts` | 440 | `export async function checkCCClawUpdate()` |
| `electron/main/ccclaw-update-service.ts` | 462 | `export async function downloadCCClawUpdate()` |
| `electron/main/ccclaw-update-service.ts` | 531 | `export async function installCCClawUpdate()` |
| `electron/main/ccclaw-update-service.ts` | 574 | `export async function openCCClawUpdateDownloadUrl()` |

#### UI 组件

| 文件 | 行号 | 代码上下文 |
|------|------|------------|
| `src/components/UpdateCenter.tsx` | 7 | `import CCClawUpdateDialog from './CCClawUpdateDialog'` |
| `src/components/UpdateCenter.tsx` | 23 | `function summarizeCCClaw(check: CombinedUpdateCheckResult | null)` |
| `src/components/UpdateCenter.tsx` | 42 | `const [showCCClawDialog, setShowCCClawDialog] = useState(false)` |
| `src/components/UpdateCenter.tsx` | 74-77 | 更新中心 Ccclaw 条目配置 |
| `src/components/UpdateCenter.tsx` | 165 | `<CCClawUpdateDialog open={showCCClawDialog} ... />` |
| `src/components/CCClawUpdateDialog.tsx` | 3 | `import type { CCClawUpdateActionResult, CCClawUpdateStatus }` |
| `src/components/CCClawUpdateDialog.tsx` | 5 | `function statusLabel(status: CCClawUpdateStatus['status'])` |
| `src/components/CCClawUpdateDialog.tsx` | 17 | `export default function CCClawUpdateDialog({ ... })` |
| `src/components/CCClawUpdateDialog.tsx` | 25 | `const [status, setStatus] = useState<CCClawUpdateStatus | null>(null)` |
| `src/components/CCClawUpdateDialog.tsx` | 30 | `const [actionResult, setActionResult] = useState<CCClawUpdateActionResult | null>` |
| `src/components/CCClawUpdateDialog.tsx` | 37 | `await window.api.checkCCClawUpdate()` |
| `src/components/CCClawUpdateDialog.tsx` | 189 | `await window.api.openCCClawUpdateDownloadUrl()` |
| `src/components/CCClawUpdateDialog.tsx` | 207 | `await window.api.downloadCCClawUpdate()` |
| `src/components/CCClawUpdateDialog.tsx` | 229 | `await window.api.installCCClawUpdate()` |

#### IPC 处理器

| 文件 | 行号 | 代码上下文 |
|------|------|------------|
| `electron/main/ipc-handlers.ts` | 123-128 | 函数导入 |
| `electron/main/ipc-handlers.ts` | 583 | `ipcMain.handle('ccclaw:uninstall:preview', ...)` |
| `electron/main/ipc-handlers.ts` | 584 | `ipcMain.handle('ccclaw:uninstall:prepare', ...)` |
| `electron/main/ipc-handlers.ts` | 616 | `ipcMain.handle('ccclaw:update:status', ...)` |
| `electron/main/ipc-handlers.ts` | 617 | `ipcMain.handle('ccclaw:update:check', ...)` |
| `electron/main/ipc-handlers.ts` | 618 | `ipcMain.handle('ccclaw:update:download', ...)` |
| `electron/main/ipc-handlers.ts` | 619 | `ipcMain.handle('ccclaw:update:install', ...)` |
| `electron/main/ipc-handlers.ts` | 620 | `ipcMain.handle('ccclaw:update:open-download-url', ...)` |

#### Preload 脚本

| 文件 | 行号 | 代码上下文 |
|------|------|------------|
| `electron/preload/index.ts` | 88 | `previewCCClawUninstall: (request) => ...` |
| `electron/preload/index.ts` | 90 | `prepareCCClawUninstall: (request) => ...` |
| `electron/preload/index.ts` | 104 | `getCCClawUpdateStatus: () => ...` |
| `electron/preload/index.ts` | 105 | `checkCCClawUpdate: () => ...` |
| `electron/preload/index.ts` | 106 | `downloadCCClawUpdate: () => ...` |
| `electron/preload/index.ts` | 107 | `installCCClawUpdate: () => ...` |
| `electron/preload/index.ts` | 108 | `openCCClawUpdateDownloadUrl: () => ...` |

---

## 附录

### A. 项目目录结构

```
ccclaw/
├── electron/
│   ├── main/                 # 主进程代码
│   │   ├── __tests__/        # 测试文件
│   │   ├── chat-transport/   # 聊天传输层
│   │   ├── index.ts          # 主入口
│   │   ├── ipc-handlers.ts   # IPC 处理器
│   │   ├── cli.ts            # CLI 封装
│   │   └── ...               # 其他服务模块
│   └── preload/              # 预加载脚本
├── src/
│   ├── assets/               # 静态资源
│   ├── components/           # React 组件
│   ├── constants/            # 常量定义
│   ├── lib/                  # 工具库
│   ├── pages/                # 页面组件
│   ├── shared/               # 共享模块
│   ├── types/                # 类型定义
│   ├── App.tsx               # 应用入口
│   └── main.tsx              # React 入口
├── docs/                     # 文档
├── scripts/                  # 构建脚本
├── build/                    # 打包资源
└── public/                   # 公共资源
```

### B. 关键配置文件

| 文件 | 用途 |
|------|------|
| `package.json` | 项目配置、依赖、脚本 |
| `electron-builder.json` | 打包配置 |
| `vite.config.ts` | Vite 构建配置 |
| `tsconfig.json` | TypeScript 配置 |
| `tailwind.config.js` | Tailwind CSS 配置 |

### C. 环境变量

| 变量 | 用途 |
|------|------|
| `CCCLAW_USER_DATA_DIR` | Ccclaw 用户数据目录 |
| `CCCLAW_SAFE_WORK_DIR` | 安全工作目录 |
| `CCCLAW_SKIP_NOTARIZE` | 跳过 macOS 公证 |

---

> 本报告由自动化工具生成，如有疑问请参考源代码或联系开发团队。
