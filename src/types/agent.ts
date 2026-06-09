/**
 * Ccclaw Agent 系统类型定义
 *
 * @fileoverview 定义 Agent 系统的所有 TypeScript 接口和类型
 * @author Ccclaw Team
 * @version 1.0
 */

/**
 * Agent 配置接口
 * 完整描述一个 Agent 的所有配置信息
 */
export interface AgentConfig {
  /** 唯一标识 (UUID v4 格式) */
  id: string;

  /** Agent 名称 (用户可见，用于列表展示) */
  name: string;

  /** Agent 描述 (简要说明 Agent 的用途和功能) */
  description: string;

  /** 头像 URL 或 Base64 编码的图片 (可选，默认使用系统图标) */
  avatar?: string;

  /** 模型配置 (指定使用的 LLM 提供商和模型) */
  model: AgentModelConfig;

  /** 系统提示词 (定义 Agent 的行为、角色和约束) */
  systemPrompt: string;

  /** 模型参数 (控制生成文本的随机性、多样性等) */
  parameters: AgentParameters;

  /** 启用的 Skills 列表 (Agent 可以调用的技能/工具) */
  skills: AgentSkillConfig[];

  /** 创建时间 (ISO 8601 格式，如 "2026-06-08T10:30:00Z") */
  createdAt: string;

  /** 更新时间 (ISO 8601 格式，每次修改配置时自动更新) */
  updatedAt: string;

  /** Agent 当前状态 */
  status: AgentStatus;

  /** 是否停用 (可选，停用后 Agent 不会出现在默认列表中) */
  disabled?: boolean;
}

/**
 * 模型配置接口
 * 定义 Agent 使用的 LLM 模型信息
 */
export interface AgentModelConfig {
  /**
   * 模型提供商
   * - 'openai' - OpenAI (GPT 系列)
   * - 'anthropic' - Anthropic (Claude 系列)
   * - 'google' - Google (Gemini 系列)
   * - 'local' - 本地模型 (通过本地 Gateway)
   */
  provider: 'openai' | 'anthropic' | 'google' | 'local';

  /** 模型 ID (如 'gpt-4', 'claude-3-opus', 'gemini-pro' 等) */
  modelId: string;

  /**
   * API Key (可选)
   * 如果未提供，则从全局配置中读取
   * 建议留空以提高安全性，使用全局配置统一管理
   */
  apiKey?: string;
}

/**
 * 模型参数接口
 * 控制 LLM 生成文本的行为
 */
export interface AgentParameters {
  /**
   * 温度 (0-2 之间)
   * 控制生成的随机性
   * - 较低值 (0.1-0.3): 更确定、更聚焦
   * - 中等值 (0.5-0.8): 平衡创造性和确定性
   * - 较高值 (1.0-2.0): 更随机、更有创意
   * @default 0.7
   */
  temperature?: number;

  /**
   * Top-P 采样 (0-1 之间)
   * 控制候选词的概率累积阈值
   * 与 temperature 二选一使用，通常不同时调整
   * @default 1.0
   */
  topP?: number;

  /**
   * 最大 Token 数
   * 限制单次响应的最大长度
   * 注意：这包括输入和输出的总 Token 数
   */
  maxTokens?: number;

  /**
   * 频率惩罚 (-2 to 2)
   * 降低重复词汇的概率
   * - 正值: 减少重复
   * - 负值: 允许更多重复
   * @default 0
   */
  frequencyPenalty?: number;

  /**
   * 存在惩罚 (-2 to 2)
   * 降低已出现词汇的概率
   * 与 frequencyPenalty 类似，但作用于整个对话历史
   * @default 0
   */
  presencePenalty?: number;
}

/**
 * Skill 配置接口
 * 定义 Agent 启用的单个 Skill 及其配置
 */
export interface AgentSkillConfig {
  /** Skill 标识 (对应 Skill 目录名称或注册 Key) */
  skillKey: string;

  /** 是否启用该 Skill */
  enabled: boolean;

  /**
   * Skill 配置 (可选)
   * 特定 Skill 的自定义配置参数
   * 结构因 Skill 而异，使用 Record<string, unknown> 保持灵活性
   */
  config?: Record<string, unknown>;
}

/**
 * Agent 状态类型
 * 描述 Agent 的当前运行状态
 */
export type AgentStatus =
  /** 空闲 - Agent 已就绪，等待用户指令 */
  | 'idle'
  /** 运行中 - Agent 正在处理用户请求 */
  | 'running'
  /** 错误 - Agent 遇到错误，需要人工介入 */
  | 'error'
  /** 已停用 - Agent 被管理员停用 */
  | 'disabled'
  /** 初始化中 - Agent 正在启动/加载资源 */
  | 'initializing';

/**
 * Agent 聊天会话接口
 * 记录一次完整的对话会话
 */
export interface AgentChatSession {
  /** 会话 ID (UUID v4 格式) */
  id: string;

  /** 关联的 Agent ID (指向 AgentConfig.id) */
  agentId: string;

  /** 消息列表 (按时间顺序排列) */
  messages: AgentChatMessage[];

  /** 创建时间 (ISO 8601 格式) */
  createdAt: string;

  /** 更新时间 (ISO 8601 格式，最后一条消息的时间) */
  updatedAt: string;
}

/**
 * Agent 聊天消息接口
 * 定义单条对话消息的结构
 */
export interface AgentChatMessage {
  /** 消息 ID (UUID v4 格式) */
  id: string;

  /**
   * 消息角色
   * - 'user' - 用户发送的消息
   * - 'assistant' - Agent 的回复
   * - 'system' - 系统消息 (如错误提示、状态通知)
   */
  role: 'user' | 'assistant' | 'system';

  /** 消息内容 (文本内容) */
  content: string;

  /** 时间戳 (ISO 8601 格式) */
  timestamp: string;

  /**
   * Skills 调用记录 (可选)
   * 仅当 role 为 'assistant' 且 Agent 调用了 Skills 时存在
   */
  skillCalls?: AgentSkillCall[];
}

/**
 * Skill 调用记录接口
 * 记录 Agent 调用 Skill 的详细信息
 */
export interface AgentSkillCall {
  /** Skill 标识 (对应 AgentSkillConfig.skillKey) */
  skillKey: string;

  /**
   * 输入参数
   * Skill 接收到的输入，结构因 Skill 而异
   */
  input: unknown;

  /**
   * 输出结果
   * Skill 执行后的返回结果，结构因 Skill 而异
   */
  output: unknown;

  /** 执行耗时 (毫秒) */
  durationMs: number;
}

/**
 * 通用 IPC 响应接口
 * 所有 IPC 调用返回的标准格式
 */
export interface AgentIPCResponse<T = unknown> {
  /** 操作是否成功 */
  ok: boolean;

  /** 返回数据 (仅当 ok=true 时存在) */
  data?: T;

  /**
   * 错误信息 (仅当 ok=false 时存在)
   */
  error?: string;
}

/**
 * Agent 列表查询过滤器
 * 用于筛选和搜索 Agent 列表
 */
export interface AgentListFilter {
  /** 按状态筛选 (可选) */
  status?: AgentStatus;

  /**
   * 搜索关键词 (可选)
   * 会在 name 和 description 字段中模糊匹配
   */
  search?: string;
}

/**
 * Agent 创建请求
 * 创建 Agent 时需要的输入数据 (排除系统自动生成的字段，status、skills、parameters 可选)
 */
export type AgentCreateInput = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'skills' | 'parameters'> & { status?: AgentStatus; skills?: AgentSkillConfig[]; parameters?: AgentParameters };

/**
 * Agent 更新请求
 * 更新 Agent 时允许部分字段更新
 */
export type AgentUpdateInput = Partial<AgentConfig>;

/**
 * 聊天请求接口
 * 发送聊天消息时的请求参数
 */
export interface AgentChatRequest {
  /** Agent ID (指向 AgentConfig.id) */
  agentId: string;

  /**
   * 会话 ID (可选)
   * 如果提供，则继续现有会话
   * 如果未提供，则创建新会话
   */
  sessionId?: string;

  /** 用户消息内容 */
  message: string;
}

/**
 * 聊天流式响应块
 * 用于 Server-Sent Events 流式返回
 */
export interface AgentChatStreamChunk {
  /** 会话 ID */
  sessionId: string;

  /** 消息 ID (同一条消息的所有 chunk 共享同一个 ID) */
  messageId: string;

  /** 增量文本 (本次新增的内容) */
  chunk: string;

  /**
   * 是否结束
   * - true: 这是最后一块，会话可以继续
   * - false: 还有后续内容
   */
  done: boolean;

  /**
   * Skills 调用记录 (可选)
   * 仅在整个响应结束时 (done=true) 可能包含此字段
   */
  skillCalls?: AgentSkillCall[];
}

/**
 * 通用操作结果接口
 * 用于返回操作的成功/失败状态
 */
export interface AgentOperationResult {
  /** 操作是否成功 */
  ok: boolean;

  /**
   * 错误信息 (可选)
   * 仅在 ok=false 时存在
   */
  error?: string;
}
