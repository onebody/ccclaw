/**
 * Agent IPC 桥接层
 *
 * @fileoverview 连接主进程的 AgentManager 和渲染进程的前端 UI
 * @author Ccclaw Team
 * @version 1.0
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AgentManager } from './agent-manager';
import type {
  AgentConfig,
  AgentCreateInput,
  AgentUpdateInput,
  AgentListFilter,
  AgentStatus,
} from '../../src/types/agent';

/**
 * AgentIPC 类 - IPC 桥接层
 * 负责注册 IPC handlers，将渲染进程的请求转发给 AgentManager
 */
export class AgentIPC {
  /** Agent 业务逻辑管理实例 */
  private manager: AgentManager;

  /** 已注册的 IPC channel 列表（用于清理） */
  private readonly channels: string[] = [
    'agent:create',
    'agent:get',
    'agent:getAll',
    'agent:update',
    'agent:delete',
    'agent:setStatus',
    'agent:exists',
  ];

  /**
   * 构造函数
   * @param manager - AgentManager 实例
   */
  constructor(manager: AgentManager) {
    this.manager = manager;
    this.registerHandlers();
    console.log('[AgentIPC] IPC handlers 注册完成');
  }

  /**
   * 注册所有 IPC handlers
   * 使用 ipcMain.handle() 监听渲染进程的请求
   */
  private registerHandlers(): void {
    // 创建 Agent
    ipcMain.handle(
      'agent:create',
      async (event: IpcMainInvokeEvent, input: AgentCreateInput) => {
        console.log('[AgentIPC] 收到创建 Agent 请求', { name: input.name });
        try {
          const config = this.manager.createAgent(input);
          console.log(`[AgentIPC] 创建 Agent 成功: ${config.id} (${config.name})`);
          return { ok: true as const, data: config };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 创建 Agent 失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 获取单个 Agent
    ipcMain.handle(
      'agent:get',
      async (event: IpcMainInvokeEvent, agentId: string) => {
        console.log('[AgentIPC] 收到获取 Agent 请求', { agentId });
        try {
          if (!agentId || agentId.trim() === '') {
            return { ok: false as const, error: 'agentId 不能为空' };
          }
          const config = this.manager.getAgent(agentId);
          return { ok: true as const, data: config };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 获取 Agent 失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 获取所有 Agent（支持筛选）
    ipcMain.handle(
      'agent:getAll',
      async (event: IpcMainInvokeEvent, filter?: AgentListFilter) => {
        console.log('[AgentIPC] 收到获取所有 Agent 请求', { filter });
        try {
          const agents = this.manager.getAllAgents(filter);
          console.log(`[AgentIPC] 获取 Agent 列表成功，共 ${agents.length} 条`);
          return { ok: true as const, data: agents };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 获取 Agent 列表失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 更新 Agent
    ipcMain.handle(
      'agent:update',
      async (event: IpcMainInvokeEvent, agentId: string, input: AgentUpdateInput) => {
        console.log('[AgentIPC] 收到更新 Agent 请求', { agentId });
        try {
          if (!agentId || agentId.trim() === '') {
            return { ok: false as const, error: 'agentId 不能为空' };
          }
          const config = this.manager.updateAgent(agentId, input);
          if (!config) {
            return { ok: false as const, error: `Agent 不存在 (${agentId})` };
          }
          console.log(`[AgentIPC] 更新 Agent 成功: ${config.id} (${config.name})`);
          return { ok: true as const, data: config };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 更新 Agent 失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 删除 Agent
    ipcMain.handle(
      'agent:delete',
      async (event: IpcMainInvokeEvent, agentId: string) => {
        console.log('[AgentIPC] 收到删除 Agent 请求', { agentId });
        try {
          if (!agentId || agentId.trim() === '') {
            return { ok: false as const, error: 'agentId 不能为空' };
          }
          const result = this.manager.deleteAgent(agentId);
          if (!result) {
            return { ok: false as const, error: `Agent 不存在 (${agentId})` };
          }
          console.log(`[AgentIPC] 删除 Agent 成功: ${agentId}`);
          return { ok: true as const, data: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 删除 Agent 失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 设置 Agent 状态
    ipcMain.handle(
      'agent:setStatus',
      async (event: IpcMainInvokeEvent, agentId: string, status: AgentStatus) => {
        console.log('[AgentIPC] 收到设置 Agent 状态请求', { agentId, status });
        try {
          if (!agentId || agentId.trim() === '') {
            return { ok: false as const, error: 'agentId 不能为空' };
          }
          if (!status) {
            return { ok: false as const, error: 'status 不能为空' };
          }
          const result = this.manager.setAgentStatus(agentId, status);
          if (!result) {
            return { ok: false as const, error: `Agent 不存在 (${agentId})` };
          }
          console.log(`[AgentIPC] 设置 Agent 状态成功: ${agentId} -> ${status}`);
          return { ok: true as const, data: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 设置 Agent 状态失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );

    // 检查 Agent 是否存在
    ipcMain.handle(
      'agent:exists',
      async (event: IpcMainInvokeEvent, agentId: string) => {
        console.log('[AgentIPC] 收到检查 Agent 存在请求', { agentId });
        try {
          if (!agentId || agentId.trim() === '') {
            return { ok: false as const, error: 'agentId 不能为空' };
          }
          const exists = this.manager.agentExists(agentId);
          return { ok: true as const, data: exists };
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          console.error('[AgentIPC] 检查 Agent 存在失败:', message);
          return { ok: false as const, error: message };
        }
      }
    );
  }

  /**
   * 清理所有 IPC handlers
   * 用于优雅关闭或重新加载
   */
  public removeHandlers(): void {
    for (const channel of this.channels) {
      ipcMain.removeHandler(channel);
    }
    console.log('[AgentIPC] IPC handlers 已清理');
  }
}
