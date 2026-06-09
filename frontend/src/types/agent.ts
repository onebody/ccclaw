/**
 * Agent 系统类型定义（前端版本）
 *
 * 与后端 src/types/agent.ts 保持一致
 */

/** Agent 状态类型 */
export type AgentStatus = 'idle' | 'running' | 'error' | 'disabled' | 'initializing';

/** 模型配置 */
export interface AgentModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  modelId: string;
  apiKey?: string;
}

/** 模型参数 */
export interface AgentParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/** Skill 配置 */
export interface AgentSkillConfig {
  skillKey: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

/** Agent 配置 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  model: AgentModelConfig;
  systemPrompt: string;
  parameters: AgentParameters;
  skills: AgentSkillConfig[];
  createdAt: string;
  updatedAt: string;
  status: AgentStatus;
  disabled?: boolean;
}

/** Agent 列表筛选 */
export interface AgentListFilter {
  status?: AgentStatus;
  search?: string;
}

/** Agent 创建输入 */
export type AgentCreateInput = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>;

/** Agent 更新输入 */
export type AgentUpdateInput = Partial<AgentConfig>;

/** IPC 响应格式 */
export interface AgentIPCResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
