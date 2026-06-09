/**
 * Ccclaw 工作空间（Workspace）系统类型定义
 *
 * @fileoverview 定义工作空间、任务（Task）、会话（ChatSession）的所有 TypeScript 接口和类型
 * @author Ccclaw Team
 * @version 1.0
 */

// ============================================================================
// 工作空间（Workspace）
// ============================================================================

/**
 * 工作空间颜色标识（用于左侧面板快速区分）
 */
export type WorkspaceColor =
  | 'green'    // #238636
  | 'blue'     // #1f6feb
  | 'purple'   // #8957e5
  | 'red'      // #da3633
  | 'yellow'   // #d29922
  | 'cyan'     // #58a6ff
  | 'orange'   // #db6d28
  | 'gray'     // #6e7681

/**
 * 工作空间完整配置
 */
export interface Workspace {
  /** 唯一标识 (UUID v4) */
  id: string

  /** 工作空间显示名称 */
  name: string

  /** 关联的本地绝对目录路径（所有文件操作都在此目录下执行） */
  rootPath: string

  /** 简短描述（可选） */
  description?: string

  /** 颜色标识 */
  color: WorkspaceColor

  /** 创建时间 (ISO 8601) */
  createdAt: string

  /** 更新时间 */
  updatedAt: string

  /** 是否为当前激活的工作空间 */
  isActive: boolean

  /** 排序权重（数值越小越靠前） */
  order: number
}

/**
 * 新建工作空间时的输入参数（不含自动生成的字段）
 */
export interface WorkspaceCreateInput {
  name: string
  rootPath: string
  description?: string
  color?: WorkspaceColor
}

/**
 * 更新工作空间时的输入参数（所有字段可选）
 */
export interface WorkspaceUpdateInput {
  name?: string
  rootPath?: string
  description?: string
  color?: WorkspaceColor
  order?: number
}

// ============================================================================
// 任务（Task）
// ============================================================================

/**
 * 任务状态机
 */
export type TaskStatus =
  | 'pending'     // 待执行
  | 'running'     // 运行中
  | 'completed'   // 已完成（正常结束）
  | 'failed'      // 失败
  | 'cancelled'   // 已取消

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * 任务记录
 * 一个 Task 代表用户在某个 Workspace 中发起的一次完整工作单元
 */
export interface Task {
  /** 唯一标识 (UUID v4) */
  id: string

  /** 所属工作空间 ID */
  workspaceId: string

  /** 任务标题（用户输入或 AI 生成） */
  title: string

  /** 任务详细描述（可选） */
  description?: string

  /** 当前状态 */
  status: TaskStatus

  /** 优先级 */
  priority: TaskPriority

  /** 关联的会话 ID 列表（一个 Task 可包含多个 ChatSession） */
  chatSessionIds: string[]

  /** 关联的 Agent 实例 ID（执行任务的 Agent，可选） */
  agentId?: string

  /** 创建时间 */
  createdAt: string

  /** 更新时间 */
  updatedAt: string

  /** 任务开始时间（进入 running 状态时记录） */
  startedAt?: string

  /** 任务结束时间（进入 completed/failed/cancelled 时记录） */
  finishedAt?: string

  /** 运行耗时（毫秒，任务结束后计算） */
  durationMs?: number

  /** 创建者标识（当前固定为 'user'，未来支持 AI 自动创建） */
  createdBy: 'user' | 'agent'

  /** 备注/错误信息（任务失败时记录错误摘要） */
  notes?: string

  /** 排序权重 */
  order: number
}

/**
 * 新建任务时的输入参数
 */
export interface TaskCreateInput {
  workspaceId: string
  title: string
  description?: string
  priority?: TaskPriority
  agentId?: string
}

/**
 * 更新任务时的输入参数
 */
export interface TaskUpdateInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  chatSessionIds?: string[]
  agentId?: string
  notes?: string
  order?: number
}

/**
 * 任务列表查询过滤器
 */
export interface TaskListFilter {
  workspaceId?: string
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority
  createdBy?: 'user' | 'agent'
  search?: string  // 模糊匹配 title
  /** 时间范围过滤 */
  from?: string    // ISO date
  to?: string      // ISO date
}

// ============================================================================
// 会话（ChatSession）
// ============================================================================

/**
 * 消息发送者类型
 */
export type MessageSender = 'user' | 'ai' | 'system'

/**
 * 单条消息
 */
export interface ChatMessage {
  /** 消息唯一 ID */
  id: string

  /** 所属会话 ID */
  sessionId: string

  /** 发送者 */
  sender: MessageSender

  /** 消息内容（Markdown 格式） */
  content: string

  /** 消息中的代码块（供制品区展示） */
  codeBlocks: CodeBlock[]

  /** 附件列表（文件引用） */
  attachments: Attachment[]

  /** 发送时间 */
  createdAt: string

  /** 关联的任务 ID */
  taskId?: string

  /** 引用来源（可选，记录消息来自哪个 Agent/Skill） */
  source?: string
}

/**
 * 代码块（从消息中提取）
 */
export interface CodeBlock {
  /** 代码语言 */
  language: string
  /** 代码内容 */
  code: string
  /** 文件路径（如果有） */
  filePath?: string
  /** 行号范围（如果有） */
  lineStart?: number
  lineEnd?: number
}

/**
 * 附件（文件引用）
 */
export interface Attachment {
  /** 文件名 */
  name: string
  /** 文件绝对路径 */
  path: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  mimeType: string
  /** 是否为目录 */
  isDirectory: boolean
}

/**
 * 会话记录
 * 一个 ChatSession 代表 Task 内的一次连续对话上下文
 */
export interface ChatSession {
  /** 唯一标识 */
  id: string

  /** 所属任务 ID */
  taskId: string

  /** 会话标题（可由用户自定义或 AI 生成） */
  title: string

  /** 创建时间 */
  createdAt: string

  /** 最后活跃时间 */
  updatedAt: string

  /** 消息总数 */
  messageCount: number
}

// ============================================================================
// 制品（Artifact）
// ============================================================================

/**
 * 制品类型
 */
export type ArtifactType =
  | 'file'        // 文件变更
  | 'screenshot'  // 截图
  | 'code'        // 代码片段
  | 'report'      // 报告/文档
  | 'other'       // 其他

/**
 * 制品记录
 * Task 执行过程中产生的文件变更、截图、代码等
 */
export interface Artifact {
  /** 唯一标识 */
  id: string

  /** 关联的任务 ID */
  taskId: string

  /** 制品类型 */
  type: ArtifactType

  /** 显示名称 */
  name: string

  /** 描述（可选） */
  description?: string

  /** 文件绝对路径（type=file 时） */
  path?: string

  /** 文件大小（字节） */
  size?: number

  /** Git 变更类型（type=file 时）：added/modified/deleted */
  gitChangeType?: 'added' | 'modified' | 'deleted'

  /** 创建时间 */
  createdAt: string

  /** 是否为新增文件 */
  isNew: boolean
}

// ============================================================================
// IPC API 类型（前端调用后端的接口定义）
// ============================================================================

/** 工作空间 API */
export interface WorkspaceAPI {
  /** 获取所有工作空间 */
  list(): Promise<Workspace[]>
  /** 获取单个工作空间 */
  get(id: string): Promise<Workspace>
  /** 新建工作空间 */
  create(input: WorkspaceCreateInput): Promise<Workspace>
  /** 更新工作空间 */
  update(id: string, input: WorkspaceUpdateInput): Promise<Workspace>
  /** 删除工作空间（同时删除其下的所有任务） */
  delete(id: string): Promise<void>
  /** 切换当前激活工作空间 */
  activate(id: string): Promise<void>
}

/** 任务 API */
export interface TaskAPI {
  list(filter?: TaskListFilter): Promise<Task[]>
  get(id: string): Promise<Task>
  create(input: TaskCreateInput): Promise<Task>
  update(id: string, input: TaskUpdateInput): Promise<Task>
  delete(id: string): Promise<void>
  /** 获取指定工作空间下的任务列表 */
  listByWorkspace(workspaceId: string): Promise<Task[]>
}

/** 会话 API */
export interface ChatSessionAPI {
  listByTask(taskId: string): Promise<ChatSession[]>
  get(id: string): Promise<ChatSession>
  create(taskId: string, title?: string): Promise<ChatSession>
  delete(id: string): Promise<void>
}

/** 消息 API */
export interface ChatMessageAPI {
  listBySession(sessionId: string): Promise<ChatMessage[]>
  send(sessionId: string, content: string): Promise<ChatMessage>
}

/** 制品 API */
export interface ArtifactAPI {
  listByTask(taskId: string): Promise<Artifact[]>
  get(id: string): Promise<Artifact>
}
