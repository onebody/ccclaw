# Ccclaw 工作空间系统功能设计规格

> 版本：v1.0
> 日期：2026-06-09
> 状态：草稿（待评审）

---

## 一、设计目标

将 Ccclaw 从"单会话 AI 助手"转变为**多工作空间 + 多任务**的 AI Agent 管理平台：

1. **工作空间隔离**：每个工作空间绑定一个本地目录，文件操作、Git 变更、制品都严格隔离
2. **任务化管理**：用户的每次工作请求作为一个 Task，支持状态跟踪、历史回溯
3. **会话连续性**：Task 内可创建多个 ChatSession（多轮对话），消息与任务关联
4. **制品沉淀**：Task 执行过程中产生的文件变更、截图、报告统一管理

---

## 二、数据模型

### 2.1 核心实体关系

```
Workspace (工作空间)
  │
  ├── Task (任务)  1:N
  │     │
  │     ├── ChatSession (会话)  1:N
  │     │     └── ChatMessage (消息)  1:N
  │     │
  │     └── Artifact (制品)  1:N
  │
  └── Agent (Agent配置)  N:M （通过 Task.agentId 关联）

注：Agent 本身不直接属于 Workspace，而是通过 Task 间接关联
    同一 Agent 可在多个 Workspace 的不同 Task 中使用
```

### 2.2 Workspace（工作空间）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 唯一标识 |
| `name` | string | 显示名称，如 "ccclaw"、"openWRT" |
| `rootPath` | string | 本地绝对路径，所有文件操作都在此目录下 |
| `description` | string? | 可选描述 |
| `color` | enum | 颜色标识，用于左侧面板视觉区分 |
| `isActive` | boolean | 当前是否激活（同一时刻只有一个 Workspace 激活） |
| `order` | number | 排序权重 |
| `createdAt` | ISO8601 | 创建时间 |
| `updatedAt` | ISO8601 | 更新时间 |

**约束**：
- `rootPath` 必须是真实存在的本地目录
- 删除 Workspace 时级联删除其下所有 Task 和 ChatSession
- `isActive` 每次只能有一个为 `true`

### 2.3 Task（任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 唯一标识 |
| `workspaceId` | UUID | 所属工作空间 |
| `title` | string | 任务标题 |
| `description` | string? | 详细描述 |
| `status` | enum | `pending`/`running`/`completed`/`failed`/`cancelled` |
| `priority` | enum | `low`/`normal`/`high`/`urgent` |
| `chatSessionIds` | UUID[] | 关联的会话列表 |
| `agentId` | UUID? | 关联的 Agent（可选） |
| `createdBy` | enum | `user`（用户发起）/ `agent`（AI 自动创建） |
| `startedAt` | ISO8601? | 开始时间 |
| `finishedAt` | ISO8601? | 结束时间 |
| `durationMs` | number? | 运行时长（毫秒） |
| `notes` | string? | 备注/错误摘要 |
| `order` | number | 排序权重 |

**状态机**：

```
pending ──▶ running ──▶ completed
   │           │
   ▼           ▼
cancelled   failed
```

### 2.4 ChatSession（会话）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 唯一标识 |
| `taskId` | UUID | 所属任务 |
| `title` | string | 会话标题 |
| `messageCount` | number | 消息总数（冗余字段，加速查询） |
| `createdAt` | ISO8601 | 创建时间 |
| `updatedAt` | ISO8601 | 最后活跃时间 |

**说明**：
- 一个 Task 可以有多个 ChatSession（如用户开启多个对话分支）
- 默认情况下，一个 Task 创建一个 ChatSession
- 切换 ChatSession 时，消息流区域加载对应会话历史

### 2.5 ChatMessage（消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 唯一标识 |
| `sessionId` | UUID | 所属会话 |
| `sender` | enum | `user`/`ai`/`system` |
| `content` | string | Markdown 内容 |
| `codeBlocks` | CodeBlock[] | 代码块列表（供制品区展示） |
| `attachments` | Attachment[] | 文件附件 |
| `taskId` | UUID? | 直接关联任务（冗余，加速查询） |
| `source` | string? | 来源 Agent/Skill 名称 |
| `createdAt` | ISO8601 | 发送时间 |

### 2.6 Artifact（制品）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 唯一标识 |
| `taskId` | UUID | 所属任务 |
| `type` | enum | `file`/`screenshot`/`code`/`report`/`other` |
| `name` | string | 显示名称 |
| `path` | string? | 文件绝对路径 |
| `gitChangeType` | enum? | `added`/`modified`/`deleted`（仅 type=file 时） |
| `isNew` | boolean | 是否为新建文件 |
| `size` | number? | 文件大小（字节） |
| `createdAt` | ISO8601 | 创建时间 |

---

## 三、存储方案

### 3.1 文件结构

所有数据存储在 Electron 的 `userData` 目录下：

```
{userData}/
  ├── workspaces.json          # 工作空间索引（不含 rootPath 等敏感信息的列表）
  ├── tasks.json                # 任务索引
  ├── chats/
  │   ├── {sessionId}.json     # 单个会话的消息列表
  │   └── ...
  └── artifacts/
      ├── {artifactId}.json    # 制品元数据
      └── ...
```

> **注**：`workspaces.json` 中 `rootPath` 为绝对路径，涉及用户本地目录结构，属于隐私数据，不上传 GitHub。

### 3.2 存储格式

均使用 **JSON** 文件（格式化，带 2 空格缩进），配合原子写入（写临时文件 + rename）保证数据完整性。

---

## 四、主内容区架构

### 4.1 标签页模型

主内容区支持 4 个固定标签页：

| 标签 | 内容 | 数据来源 |
|------|------|---------|
| **对话** | 当前 Task 的消息流 + 输入框 | `ChatSession.messages` |
| **文件变更** | Git diff 列表 + 预览 | `Task.relatedFiles` (通过 rootPath 执行 git diff) |
| **制品** | Artifact 列表（截图、代码片段、文件） | `Task.artifacts` |
| **日志** | 运行日志、错误堆栈 | `Task.logs` (stderr/stdout) |

### 4.2 路由设计

```
/                                          → 重定向到 /workspace/{active}/task/{latest}
/workspace/:workspaceId                    → 工作空间概览
/workspace/:workspaceId/task/:taskId      → 任务详情（默认打开「对话」标签）
/workspace/:workspaceId/task/:taskId/:tab  → 指定标签页
  └── tab = chat | files | artifacts | logs
```

### 4.3 右侧工具面板（可折叠，320px）

点击主内容区右上角「设置」按钮展开，提供：

| 工具 | 说明 |
|------|------|
| **文件浏览器** | 读取 `workspace.rootPath` 目录树，支持预览常见文件 |
| **Git 面板** | 实时展示 `git status` + `git diff` |
| **终端** | 嵌入 iframe 终端（xterm.js），执行 `workspace.rootPath` 下的命令 |
| **Agent 配置** | 快速切换当前 Task 关联的 Agent |

---

## 五、IPC 接口设计（主进程 ↔ 渲染进程）

### 5.1 工作空间

```typescript
// 前端 → 主进程
'workspace:list'        → Promise<Workspace[]>
'workspace:get'         → (id: string) => Promise<Workspace>
'workspace:create'      → (input: WorkspaceCreateInput) => Promise<Workspace>
'workspace:update'      → (id: string, input: WorkspaceUpdateInput) => Promise<Workspace>
'workspace:delete'      → (id: string) => Promise<void>
'workspace:activate'    → (id: string) => Promise<void>
'workspace:validate'    → (path: string) => Promise<{valid: boolean; error?: string}>
'workspace:openDialog'  → () => Promise<string | null>  // 打开系统目录选择器
```

### 5.2 任务

```typescript
'task:list'             → (filter?: TaskListFilter) => Promise<Task[]>
'task:get'              → (id: string) => Promise<Task>
'task:create'           → (input: TaskCreateInput) => Promise<Task>
'task:update'           → (id: string, input: TaskUpdateInput) => Promise<Task>
'task:delete'           → (id: string) => Promise<void>
'task:start'            → (id: string) => Promise<void>   // pending → running
'task:complete'         → (id: string) => Promise<void>   // running → completed
'task:fail'             → (id: string, notes: string) => Promise<void>
'task:cancel'           → (id: string) => Promise<void>
```

### 5.3 会话与消息

```typescript
'session:listByTask'    → (taskId: string) => Promise<ChatSession[]>
'session:get'           → (id: string) => Promise<ChatSession>
'session:create'        → (taskId: string, title?: string) => Promise<ChatSession>
'session:delete'        → (id: string) => Promise<void>
'session:setActive'     → (taskId: string, sessionId: string) => Promise<void>

'message:listBySession' → (sessionId: string) => Promise<ChatMessage[]>
'message:send'          → (sessionId: string, content: string) => Promise<ChatMessage>
```

### 5.4 制品

```typescript
'artifact:listByTask'   → (taskId: string) => Promise<Artifact[]>
'artifact:get'         → (id: string) => Promise<Artifact>
'artifact:create'       → (input: Omit<Artifact, 'id' | 'createdAt'>) => Promise<Artifact>
'artifact:delete'       → (id: string) => Promise<void>
'artifact:openFile'     → (id: string) => void  // 用系统默认应用打开文件
```

---

## 六、关键业务流程

### 6.1 新建工作空间

```
用户点击「新建工作空间」
        │
        ▼
  打开系统目录选择器（Electron dialog）
        │
        ▼
  验证目录存在且可读写
        │
        ▼
  写入 workspaces.json（原子写入）
        │
        ▼
  设为激活状态（其他 workspace.isActive = false）
        │
        ▼
  刷新左侧面板 + 打开工作空间
```

### 6.2 新建任务

```
用户点击左侧「新建任务」按钮
        │
        ▼
  弹出任务创建对话框
  - 标题（必填）
  - 描述（可选）
  - 优先级（默认 normal）
  - Agent 选择（可选）
        │
        ▼
  写入 tasks.json
        │
        ▼
  自动创建第一个 ChatSession
        │
        ▼
  状态 → pending
  跳转到 /workspace/{id}/task/{taskId}/chat
```

### 6.3 发送消息（对话流程）

```
用户在输入框输入内容，按下发送
        │
        ▼
  保存用户消息到 ChatSession
        │
        ▼
  UI 立即展示用户消息（pending 状态）
        │
        ▼
  Task 状态 pending → running（如尚未开始）
        │
        ▼
  将消息路由到对应 Agent / LLM
        │
        ├── Agent 模式：调用 AgentManager 处理
        └── 助手模式：调用 OpenClaw AI API
        │
        ▼
  AI 响应流式返回，实时展示在 UI
        │
        ▼
  响应结束，保存 AI 消息到 ChatSession
        │
        ▼
  检查是否有文件变更 → 生成 Artifact
        │
        ▼
  Task 状态 running → completed（正常结束）或保持 running（多轮对话）
```

### 6.4 文件变更追踪

```
每当 Agent 执行完一轮对话
        │
        ▼
  主进程在 workspace.rootPath 下执行 git status
        │
        ▼
  比对变更文件列表（相对于 rootPath）
        │
        ▼
  为每个变更文件创建 Artifact 记录
        │
        ▼
  UI 「文件变更」标签页展示 diff 列表
  支持点击查看具体 diff 内容
```

---

## 七、UI 交互细节

### 7.1 左侧工作空间面板

- **新建工作空间**：点击面板头部「➕」按钮 → 弹窗（名称 + 本地目录选择器 + 颜色 + 描述）
- **切换工作空间**：点击工作空间名称 → 设为 `isActive` → 主内容区刷新
- **展开/折叠任务列表**：点击工作空间行左侧 chevron → 展开/折叠 `taskList`
- **新建任务**：点击面板顶部「新建任务」按钮 → 当前激活工作空间下创建 Task
- **删除工作空间**：右键菜单 → 二次确认（级联删除所有子任务）
- **排序**：支持拖拽调整 `order`

### 7.2 主内容区

- **切换标签页**：点击标签 → 更新 URL → 加载对应视图
- **文件变更**：展示相对路径 + Git 状态标记（`M`/`A`/`D`）+ 点击展开 diff
- **制品**：网格视图 + 文件类型图标 + 双击打开
- **日志**：实时流式 + 关键字高亮（error/warn/info）+ 搜索

### 7.3 输入框

- `@` 引用：输入 `@` 触发文件/消息搜索
- `/` 指令：输入 `/` 触发内置指令（新建任务、切换 Agent、截图等）
- 附件按钮：打开系统文件选择器，生成 Attachment 记录
- 技能按钮：选择可调用的 Skill

---

## 八、向后兼容

- **现有 IPC 保持不变**：已有的 `agent:*`、`rpa:*`、`openclaw:*` 等 IPC 通道不受影响
- **新增 `workspace:*`、`task:*`、`session:*`、`artifact:*` 通道**：从零实现，不修改现有代码
- **现有 OpenClaw 升级/备份流程**：继续使用原有逻辑，新增 Workspace 隔离后每个 Workspace 可独立管理 OpenClaw 版本

---

## 九、待评审问题

| # | 问题 | 建议方案 |
|---|------|---------|
| 1 | Task 删除后 ChatSession/Artifact 是否保留？ | 级联删除，保持数据整洁 |
| 2 | 消息太多（如 10000 条）如何处理？ | 实施分页加载（每页 50 条）+ 虚拟滚动 |
| 3 | Git 变更如何处理二进制文件？ | 二进制文件变更不生成 diff，展示文件名 |
| 4 | Workspace rootPath 如果目录被删除？ | 启动时检测，提示用户重新选择或删除 Workspace |
| 5 | 多端同步（未来需求）？ | 数据模型已预留 `syncId` 字段，暂不实现 |

---

## 十、里程碑计划

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| **Phase 1** | 工作空间 CRUD + 存储层 + IPC 通道 | P0 |
| **Phase 2** | 任务 CRUD + 状态机 + 基本 UI | P0 |
| **Phase 3** | 会话 + 消息流（对接现有 AI 能力） | P0 |
| **Phase 4** | 制品管理 + 文件变更展示 | P1 |
| **Phase 5** | 右侧工具面板（文件浏览器 + Git） | P1 |
| **Phase 6** | 路由系统 + 标签页切换逻辑 | P0 |
