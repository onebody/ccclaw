/**
 * Agent UI 相关类型定义
 *
 * @fileoverview 定义 Agent 管理 UI 所需的类型
 * @author Ccclaw Team
 * @version 1.0
 */

import type { AgentConfig, AgentStatus, AgentModelConfig, AgentParameters } from '../../src/types/agent'

/**
 * Agent 表单数据（用于创建/编辑）
 * 排除系统自动生成的字段
 */
export interface AgentFormData {
  /** Agent 名称 */
  name: string
  /** Agent 描述 */
  description: string
  /** 头像 URL（可选） */
  avatar?: string
  /** 模型配置 */
  model: AgentModelConfig
  /** 系统提示词 */
  systemPrompt: string
  /** 模型参数 */
  parameters: AgentParameters
  /** 启用的 Skills 列表 */
  skills: AgentConfig['skills']
  /** Agent 状态 */
  status: AgentStatus
}

/**
 * Agent 编辑器模式
 */
export type AgentEditorMode = 'create' | 'edit'

/**
 * Agent 编辑器 Props
 */
export interface AgentEditorProps {
  /** 是否打开 */
  opened: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 模式：创建或编辑 */
  mode: AgentEditorMode
  /** 编辑时的初始数据（仅编辑模式） */
  initialData?: AgentConfig
  /** 保存成功回调 */
  onSave?: (agent: AgentConfig) => void
}

/**
 * Agent 列表筛选条件（UI 专用）
 */
export interface AgentUIFilter {
  /** 按状态筛选 */
  status?: AgentStatus
  /** 搜索关键词 */
  search?: string
  /** 排序方式 */
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Agent 操作结果（UI 专用）
 */
export interface AgentUIActionResult {
  /** 是否成功 */
  ok: boolean
  /** 错误信息（失败时） */
  error?: string
  /** 操作的数据 */
  data?: AgentConfig
}
