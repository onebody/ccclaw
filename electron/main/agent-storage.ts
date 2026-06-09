/**
 * Agent 数据存储模块
 *
 * @fileoverview 提供 Agent 配置的持久化存储功能
 * @author Ccclaw Team
 * @version 1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AgentConfig } from '../../src/types/agent';

/**
 * AgentStorage 类 - 数据存储层
 * 负责 Agent 配置的文件读写操作
 */
export class AgentStorage {
  /** 存储目录路径 */
  private storagePath: string;

  /**
   * 构造函数
   * @param storagePath - Agent 配置文件的存储目录路径
   */
  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
  }

  /**
   * 确保存储目录存在
   * 如果目录不存在，则递归创建
   */
  private ensureStorageDirectory(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
    } catch (error) {
      console.error('[AgentStorage] 创建存储目录失败:', error);
      throw new Error(`无法创建存储目录: ${this.storagePath}`);
    }
  }

  /**
   * 获取 Agent 配置文件路径
   * @param agentId - Agent ID
   * @returns 完整的文件路径
   */
  private getAgentFilePath(agentId: string): string {
    return path.join(this.storagePath, `${agentId}.json`);
  }

  /**
   * 获取 Agent 配置临时文件路径（用于原子写入）
   * @param agentId - Agent ID
   * @returns 临时文件的完整路径
   */
  private getAgentTempFilePath(agentId: string): string {
    return path.join(this.storagePath, `${agentId}.json.tmp`);
  }

  /**
   * 保存 Agent 配置
   * 使用原子写入（先写临时文件，再重命名）确保数据完整性
   *
   * @param config - Agent 配置对象
   * @throws {Error} 当写入失败时抛出异常
   */
  saveAgent(config: AgentConfig): void {
    const filePath = this.getAgentFilePath(config.id);
    const tempPath = this.getAgentTempFilePath(config.id);

    try {
      // 确保存储目录存在
      this.ensureStorageDirectory();

      // 序列化为格式化的 JSON
      const jsonContent = JSON.stringify(config, null, 2);

      // 先写入临时文件
      fs.writeFileSync(tempPath, jsonContent, 'utf-8');

      // 原子重命名（在大多数文件系统中是原子操作）
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      // 清理临时文件（如果存在）
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupError) {
        console.error('[AgentStorage] 清理临时文件失败:', cleanupError);
      }

      console.error('[AgentStorage] 保存 Agent 配置失败:', error);
      throw new Error(`保存 Agent 配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 加载 Agent 配置
   *
   * @param agentId - Agent ID
   * @returns Agent 配置对象，如果文件不存在或解析失败则返回 null
   */
  loadAgent(agentId: string): AgentConfig | null {
    const filePath = this.getAgentFilePath(agentId);

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return null;
      }

      // 读取并解析 JSON 文件
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(fileContent) as AgentConfig;

      return config;
    } catch (error) {
      console.error(`[AgentStorage] 加载 Agent 配置失败 (${agentId}):`, error);
      return null;
    }
  }

  /**
   * 加载所有 Agent 配置
   * 读取存储目录下所有 .json 文件，跳过无法解析的文件
   *
   * @returns Agent 配置对象数组，按 updatedAt 降序排序
   */
  loadAllAgents(): AgentConfig[] {
    try {
      // 确保存储目录存在
      if (!fs.existsSync(this.storagePath)) {
        return [];
      }

      // 读取目录下所有文件
      const files = fs.readdirSync(this.storagePath);
      const agents: AgentConfig[] = [];

      for (const file of files) {
        // 只处理 .json 文件，跳过临时文件
        if (!file.endsWith('.json') || file.includes('.json.tmp')) {
          continue;
        }

        try {
          const filePath = path.join(this.storagePath, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const config = JSON.parse(fileContent) as AgentConfig;

          // 基础验证：检查必要字段
          if (config.id && config.name) {
            agents.push(config);
          } else {
            console.warn(`[AgentStorage] 跳过无效的 Agent 配置文件: ${file}`);
          }
        } catch (error) {
          console.error(`[AgentStorage] 解析 Agent 配置文件失败 (${file}):`, error);
          // 继续处理其他文件
        }
      }

      // 按 updatedAt 降序排序（最新的在前面）
      agents.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });

      return agents;
    } catch (error) {
      console.error('[AgentStorage] 加载所有 Agent 配置失败:', error);
      return [];
    }
  }

  /**
   * 删除 Agent 配置
   *
   * @param agentId - Agent ID
   * @param keepSessions - 是否保留会话文件（预留参数，当前版本未实现会话存储）
   * @returns 是否删除成功（文件不存在返回 false）
   */
  deleteAgent(agentId: string, keepSessions: boolean = false): boolean {
    const filePath = this.getAgentFilePath(agentId);

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.warn(`[AgentStorage] Agent 配置文件不存在: ${agentId}`);
        return false;
      }

      // 删除配置文件
      fs.unlinkSync(filePath);

      // TODO: 如果 keepSessions = false，删除对应的会话文件
      // 当前版本会话存储尚未实现，预留接口

      return true;
    } catch (error) {
      console.error(`[AgentStorage] 删除 Agent 配置失败 (${agentId}):`, error);
      return false;
    }
  }

  /**
   * 检查 Agent 配置是否存在
   *
   * @param agentId - Agent ID
   * @returns 是否存在
   */
  agentExists(agentId: string): boolean {
    const filePath = this.getAgentFilePath(agentId);
    return fs.existsSync(filePath);
  }
}
