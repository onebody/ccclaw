/**
 * Agent 业务逻辑管理模块
 *
 * @fileoverview 提供 Agent 的创建、查询、更新、删除等业务逻辑
 * @author Ccclaw Team
 * @version 1.0
 */

import * as crypto from 'crypto';
import type {
  AgentConfig,
  AgentCreateInput,
  AgentUpdateInput,
  AgentListFilter,
  AgentStatus,
} from '../../src/types/agent';
import { AgentStorage } from './agent-storage';

/**
 * AgentManager 类 - 业务逻辑层
 * 负责 Agent 的业务逻辑处理，调用 AgentStorage 进行数据持久化
 */
export class AgentManager {
  /** Agent 数据存储实例 */
  private storage: AgentStorage;

  /**
   * 构造函数
   * @param storage - AgentStorage 实例
   */
  constructor(storage: AgentStorage) {
    this.storage = storage;
  }

  /**
   * 创建新 Agent
   * 自动生成唯一 ID 和时间戳
   *
   * @param input - Agent 创建输入数据
   * @returns 完整的 AgentConfig 对象
   * @throws {Error} 当参数验证失败时抛出异常
   */
  createAgent(input: AgentCreateInput): AgentConfig {
    // 参数验证
    if (!input.name || input.name.trim() === '') {
      throw new Error('Agent 名称不能为空');
    }

    if (!input.model) {
      throw new Error('模型配置不能为空');
    }

    if (!input.model.provider || !input.model.modelId) {
      throw new Error('模型提供商和模型 ID 不能为空');
    }

    if (!input.systemPrompt || input.systemPrompt.trim() === '') {
      throw new Error('系统提示词不能为空');
    }

    // 生成唯一 ID 和时间戳
    const now = new Date().toISOString();
    const agentId = crypto.randomUUID();

    // 构建完整的 Agent 配置
    const config: AgentConfig = {
      ...input,
      id: agentId,
      createdAt: now,
      updatedAt: now,
      status: input.status || 'idle',
      skills: input.skills || [],
      parameters: input.parameters || {},
    };

    // 保存到存储
    this.storage.saveAgent(config);

    console.log(`[AgentManager] 创建 Agent 成功: ${config.id} (${config.name})`);

    return config;
  }

  /**
   * 获取单个 Agent 配置
   *
   * @param agentId - Agent ID
   * @returns Agent 配置对象，如果不存在则返回 null
   */
  getAgent(agentId: string): AgentConfig | null {
    if (!agentId || agentId.trim() === '') {
      console.warn('[AgentManager] 获取 Agent 失败: agentId 不能为空');
      return null;
    }

    return this.storage.loadAgent(agentId);
  }

  /**
   * 获取所有 Agent（支持筛选）
   *
   * @param filter - 可选的筛选条件
   * @returns 筛选后的 Agent 配置数组
   */
  getAllAgents(filter?: AgentListFilter): AgentConfig[] {
    // 加载所有 Agent
    let agents = this.storage.loadAllAgents();

    // 应用筛选条件
    if (filter) {
      // 按状态筛选
      if (filter.status) {
        agents = agents.filter((agent) => agent.status === filter.status);
      }

      // 按关键词搜索（在 name 和 description 中模糊匹配）
      if (filter.search && filter.search.trim() !== '') {
        const searchLower = filter.search.toLowerCase();
        agents = agents.filter((agent) => {
          const nameMatch = agent.name.toLowerCase().includes(searchLower);
          const descMatch = agent.description.toLowerCase().includes(searchLower);
          return nameMatch || descMatch;
        });
      }
    }

    return agents;
  }

  /**
   * 更新 Agent 配置
   * 自动更新 updatedAt 时间戳
   *
   * @param agentId - Agent ID
   * @param input - 更新输入数据（支持部分字段更新）
   * @returns 更新后的 AgentConfig，如果 Agent 不存在则返回 null
   */
  updateAgent(agentId: string, input: AgentUpdateInput): AgentConfig | null {
    if (!agentId || agentId.trim() === '') {
      console.warn('[AgentManager] 更新 Agent 失败: agentId 不能为空');
      return null;
    }

    // 加载现有配置
    const existing = this.storage.loadAgent(agentId);
    if (!existing) {
      console.warn(`[AgentManager] 更新 Agent 失败: Agent 不存在 (${agentId})`);
      return null;
    }

    // 验证更新后的名称（如果提供了名称）
    if (input.name !== undefined && (!input.name || input.name.trim() === '')) {
      throw new Error('Agent 名称不能为空');
    }

    // 合并更新字段
    const updated: AgentConfig = {
      ...existing,
      ...input,
      id: existing.id, // 防止 ID 被修改
      createdAt: existing.createdAt, // 防止创建时间被修改
      updatedAt: new Date().toISOString(), // 自动更新时间戳
    };

    // 保存到存储
    this.storage.saveAgent(updated);

    console.log(`[AgentManager] 更新 Agent 成功: ${updated.id} (${updated.name})`);

    return updated;
  }

  /**
   * 删除 Agent
   *
   * @param agentId - Agent ID
   * @param keepSessions - 是否保留会话文件（传递给存储层）
   * @returns 是否删除成功
   */
  deleteAgent(agentId: string, keepSessions: boolean = false): boolean {
    if (!agentId || agentId.trim() === '') {
      console.warn('[AgentManager] 删除 Agent 失败: agentId 不能为空');
      return false;
    }

    const result = this.storage.deleteAgent(agentId, keepSessions);

    if (result) {
      console.log(`[AgentManager] 删除 Agent 成功: ${agentId}`);
    } else {
      console.warn(`[AgentManager] 删除 Agent 失败: Agent 不存在 (${agentId})`);
    }

    return result;
  }

  /**
   * 设置 Agent 状态
   *
   * @param agentId - Agent ID
   * @param status - 新的状态
   * @returns 是否设置成功
   */
  setAgentStatus(agentId: string, status: AgentStatus): boolean {
    if (!agentId || agentId.trim() === '') {
      console.warn('[AgentManager] 设置 Agent 状态失败: agentId 不能为空');
      return false;
    }

    // 加载现有配置
    const existing = this.storage.loadAgent(agentId);
    if (!existing) {
      console.warn(`[AgentManager] 设置 Agent 状态失败: Agent 不存在 (${agentId})`);
      return false;
    }

    // 更新状态
    existing.status = status;
    existing.updatedAt = new Date().toISOString();

    // 保存到存储
    this.storage.saveAgent(existing);

    console.log(`[AgentManager] 设置 Agent 状态成功: ${agentId} -> ${status}`);

    return true;
  }

  /**
   * 检查 Agent 是否存在
   *
   * @param agentId - Agent ID
   * @returns 是否存在
   */
  agentExists(agentId: string): boolean {
    return this.storage.agentExists(agentId);
  }
}
