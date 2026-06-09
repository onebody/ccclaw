/**
 * RPA 数据存储模块
 *
 * @fileoverview 提供 RPA 任务的持久化存储功能（JSON 文件存储）
 * @author Ccclaw Team
 * @version 1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RpaTask } from '../../../src/types/rpa';

/**
 * RpaStorage 类 - RPA 数据存储层
 * 负责 RPA 任务的 JSON 文件读写操作
 * 使用原子写入防止数据损坏
 */
export class RpaStorage {
  /** 存储目录路径 */
  private storagePath: string;

  /**
   * 构造函数
   * @param storagePath - RPA 任务存储目录路径
   * @throws {Error} 如果无法创建存储目录则抛出异常
   */
  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
  }

  /**
   * 确保存储目录存在
   * 如果目录不存在则创建
   *
   * @private
   * @throws {Error} 如果无法创建目录则抛出异常
   */
  private ensureStorageDirectory(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
        console.log(`[RpaStorage] 创建存储目录: ${this.storagePath}`);
      }
    } catch (error) {
      throw new Error(`无法创建 RPA 存储目录: ${this.storagePath}, 错误: ${error}`);
    }
  }

  /**
   * 保存 RPA 任务到 JSON 文件
   * 使用原子写入（先写临时文件，再重命名）防止数据损坏
   *
   * @param task - RPA 任务对象
   * @throws {Error} 如果写入失败则抛出异常
   */
  saveTask(task: RpaTask): void {
    const filePath = this.getTaskFilePath(task.id);

    try {
      const jsonContent = JSON.stringify(task, null, 2);
      const tempFilePath = `${filePath}.tmp`;

      // 先写入临时文件
      fs.writeFileSync(tempFilePath, jsonContent, 'utf-8');

      // 原子重命名（在大多数文件系统中是原子操作）
      fs.renameSync(tempFilePath, filePath);

      console.log(`[RpaStorage] 保存 RPA 任务成功: ${filePath}`);
    } catch (error) {
      throw new Error(`保存 RPA 任务失败: ${filePath}, 错误: ${error}`);
    }
  }

  /**
   * 从 JSON 文件加载 RPA 任务
   *
   * @param taskId - 任务 ID
   * @returns RPA 任务对象，如果文件不存在或格式错误则返回 null
   */
  loadTask(taskId: string): RpaTask | null {
    const filePath = this.getTaskFilePath(taskId);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const jsonContent = fs.readFileSync(filePath, 'utf-8');
      const task = JSON.parse(jsonContent) as RpaTask;

      // 基本验证：检查必需字段
      if (!task.id || !task.name || !task.type) {
        console.warn(`[RpaStorage] 跳过无效的 RPA 任务文件: ${path.basename(filePath)}`);
        return null;
      }

      return task;
    } catch (error) {
      console.error(`[RpaStorage] 加载 RPA 任务失败 (${taskId}):`, error);
      return null;
    }
  }

  /**
   * 加载所有 RPA 任务
   *
   * @returns RPA 任务对象数组
   */
  loadAllTasks(): RpaTask[] {
    try {
      const files = fs.readdirSync(this.storagePath);
      const tasks: RpaTask[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(this.storagePath, file);
        const jsonContent = fs.readFileSync(filePath, 'utf-8');

        try {
          const task = JSON.parse(jsonContent) as RpaTask;

          // 基本验证：检查必需字段
          if (!task.id || !task.name || !task.type) {
            console.warn(`[RpaStorage] 跳过无效的 RPA 任务文件: ${file}`);
            continue;
          }

          tasks.push(task);
        } catch {
          console.warn(`[RpaStorage] 解析 RPA 任务文件失败: ${file}`);
        }
      }

      return tasks;
    } catch (error) {
      console.error(`[RpaStorage] 加载所有 RPA 任务失败:`, error);
      return [];
    }
  }

  /**
   * 删除 RPA 任务文件
   *
   * @param taskId - 任务 ID
   * @returns 是否删除成功
   */
  deleteTask(taskId: string): boolean {
    const filePath = this.getTaskFilePath(taskId);

    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      fs.unlinkSync(filePath);
      console.log(`[RpaStorage] 删除 RPA 任务文件成功: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`[RpaStorage] 删除 RPA 任务文件失败 (${taskId}):`, error);
      return false;
    }
  }

  /**
   * 检查 RPA 任务是否存在
   *
   * @param taskId - 任务 ID
   * @returns 是否存在
   */
  taskExists(taskId: string): boolean {
    const filePath = this.getTaskFilePath(taskId);
    return fs.existsSync(filePath);
  }

  /**
   * 获取 RPA 任务文件路径
   *
   * @param taskId - 任务 ID
   * @returns 完整的文件路径
   * @private
   */
  private getTaskFilePath(taskId: string): string {
    return path.join(this.storagePath, `${taskId}.json`);
  }
}
