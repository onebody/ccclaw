/**
 * Web RPA 管理器
 *
 * @fileoverview 提供 Web RPA（浏览器自动化）功能的业务逻辑管理
 * @author Ccclaw Team
 * @version 1.0
 */

import * as crypto from 'crypto';
import type {
  RpaTask,
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  RpaTaskStatus,
  RpaStep,
  RpaExecutionResult,
  RpaStepLog,
  WebRpaAction,
} from '../../../src/types/rpa';
import { RpaStorage } from './rpa-storage';

/**
 * WebRpaManager 类 - Web RPA 业务逻辑层
 * 负责 Web RPA 任务的创建、查询、更新、删除和执行
 */
export class WebRpaManager {
  /** RPA 数据存储实例 */
  private storage: RpaStorage;
  /** 正在执行的任务 */
  private runningTasks: Map<string, boolean> = new Map();
  /** Playwright browser 实例 */
  private browser: any = null;
  /** Playwright 是否可用 */
  private playwrightAvailable: boolean = false;

  /**
   * 构造函数
   * @param storage - RpaStorage 实例
   */
  constructor(storage: RpaStorage) {
    this.storage = storage;
    this.checkPlaywrightAvailability();
  }

  /**
   * 检查 Playwright 是否可用
   */
  private checkPlaywrightAvailability(): void {
    try {
      require('playwright');
      this.playwrightAvailable = true;
      console.log('[WebRpaManager] Playwright 可用');
    } catch (err) {
      this.playwrightAvailable = false;
      console.warn('[WebRpaManager] Playwright 未安装，Web RPA 功能将不可用');
    }
  }

  /**
   * 初始化 Playwright browser 实例
   */
  private async initBrowser(): Promise<any> {
    if (!this.playwrightAvailable) {
      throw new Error('Playwright 未安装，请运行 npm install playwright 安装');
    }

    if (this.browser) {
      return this.browser;
    }

    const { chromium } = require('playwright');
    this.browser = await chromium.launch({
      headless: true, // 可以改为 false 以便调试
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('[WebRpaManager] Playwright browser 已启动');
    return this.browser;
  }

  /**
   * 关闭 Playwright browser 实例
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[WebRpaManager] Playwright browser 已关闭');
    }
  }

  /**
   * 创建新 RPA 任务
   * 自动生成唯一 ID 和时间戳
   *
   * @param input - RPA 任务创建输入数据
   * @returns 完整的 RpaTask 对象
   * @throws {Error} 当参数验证失败时抛出异常
   */
  createTask(input: RpaTaskCreateInput): RpaTask {
    // 参数验证
    if (!input.name || input.name.trim() === '') {
      throw new Error('RPA 任务名称不能为空');
    }

    if (!input.type || input.type !== 'web') {
      throw new Error('任务类型必须为 web');
    }

    // 生成唯一 ID 和时间戳
    const now = new Date().toISOString();
    const taskId = crypto.randomUUID();

    // 构建完整的任务对象
    const task: RpaTask = {
      id: taskId,
      name: input.name,
      description: input.description || '',
      type: 'web',
      status: 'idle',
      steps: input.steps ? this.generateStepIds(input.steps) : [],
      config: input.config,
      createdAt: now,
      updatedAt: now,
    };

    // 保存到存储
    this.storage.saveTask(task);

    console.log(`[WebRpaManager] 创建 RPA 任务成功: ${task.id} (${task.name})`);

    return task;
  }

  /**
   * 获取单个 RPA 任务
   *
   * @param taskId - 任务 ID
   * @returns RPA 任务对象，如果不存在则返回 null
   */
  getTask(taskId: string): RpaTask | null {
    if (!taskId || taskId.trim() === '') {
      console.warn('[WebRpaManager] 获取 RPA 任务失败: taskId 不能为空');
      return null;
    }

    return this.storage.loadTask(taskId);
  }

  /**
   * 获取所有 RPA 任务（支持筛选）
   *
   * @param filter - 可选的筛选条件
   * @returns 筛选后的 RPA 任务数组
   */
  getAllTasks(filter?: RpaTaskListFilter): RpaTask[] {
    // 加载所有任务
    let tasks = this.storage.loadAllTasks().filter((task) => task.type === 'web');

    // 应用筛选条件
    if (filter) {
      // 按状态筛选
      if (filter.status) {
        tasks = tasks.filter((task) => task.status === filter.status);
      }

      // 按关键词搜索（在 name 和 description 中模糊匹配）
      if (filter.search && filter.search.trim() !== '') {
        const searchLower = filter.search.toLowerCase();
        tasks = tasks.filter((task) => {
          const nameMatch = task.name.toLowerCase().includes(searchLower);
          const descMatch = task.description.toLowerCase().includes(searchLower);
          return nameMatch || descMatch;
        });
      }
    }

    return tasks;
  }

  /**
   * 更新 RPA 任务
   * 自动更新 updatedAt 时间戳
   *
   * @param taskId - 任务 ID
   * @param input - 更新输入数据（支持部分字段更新）
   * @returns 更新后的 RpaTask，如果任务不存在则返回 null
   */
  updateTask(taskId: string, input: RpaTaskUpdateInput): RpaTask | null {
    if (!taskId || taskId.trim() === '') {
      console.warn('[WebRpaManager] 更新 RPA 任务失败: taskId 不能为空');
      return null;
    }

    // 加载现有配置
    const existing = this.storage.loadTask(taskId);
    if (!existing) {
      console.warn(`[WebRpaManager] 更新 RPA 任务失败: 任务不存在 (${taskId})`);
      return null;
    }

    // 验证更新后的名称（如果提供了名称）
    if (input.name !== undefined && (!input.name || input.name.trim() === '')) {
      throw new Error('RPA 任务名称不能为空');
    }

    // 合并更新字段（使用显式赋值避免类型错误）
    const updated = {
      id: existing.id,
      name: input.name !== undefined ? input.name : existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      type: 'web' as const,
      status: input.status !== undefined ? input.status : existing.status,
      steps: input.steps !== undefined ? this.generateStepIds(input.steps) : existing.steps,
      config: input.config !== undefined ? input.config : existing.config,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      lastExecutedAt: existing.lastExecutedAt,
      executionResult: existing.executionResult,
    } as RpaTask;

    // 如果更新了步骤，重新生成步骤 ID
    if (input.steps) {
      updated.steps = this.generateStepIds(input.steps);
    }

    // 保存到存储
    this.storage.saveTask(updated);

    console.log(`[WebRpaManager] 更新 RPA 任务成功: ${updated.id} (${updated.name})`);

    return updated;
  }

  /**
   * 删除 RPA 任务
   *
   * @param taskId - 任务 ID
   * @returns 是否删除成功
   */
  deleteTask(taskId: string): boolean {
    if (!taskId || taskId.trim() === '') {
      console.warn('[WebRpaManager] 删除 RPA 任务失败: taskId 不能为空');
      return false;
    }

    const result = this.storage.deleteTask(taskId);

    if (result) {
      console.log(`[WebRpaManager] 删除 RPA 任务成功: ${taskId}`);
    } else {
      console.warn(`[WebRpaManager] 删除 RPA 任务失败: 任务不存在 (${taskId})`);
    }

    return result;
  }

  /**
   * 执行 RPA 任务 - 使用 Playwright 实现实际的浏览器自动化
   *
   * @param taskId - 任务 ID
   * @returns 执行结果
   */
  async executeTask(taskId: string): Promise<RpaExecutionResult> {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`RPA 任务不存在: ${taskId}`);
    }

    if (this.runningTasks.has(taskId)) {
      throw new Error(`RPA 任务正在执行中: ${taskId}`);
    }

    // 标记任务为运行中
    this.runningTasks.set(taskId, true);
    task.status = 'running';
    task.lastExecutedAt = new Date().toISOString();
    this.storage.saveTask(task);

    const startTime = new Date().toISOString();
    const stepLogs: RpaStepLog[] = [];
    let stepsExecuted = 0;
    let error: string | undefined;

    // Playwright 相关变量
    let browser = null;
    let page = null;

    try {
      console.log(`[WebRpaManager] 开始执行 RPA 任务: ${taskId}`);

      // 初始化 Playwright browser 和 page
      if (!this.playwrightAvailable) {
        throw new Error('Playwright 未安装，请运行 npm install playwright 和 npx playwright install 安装');
      }

      const { chromium } = require('playwright');
      browser = await chromium.launch({
        headless: task.config?.browser?.headless !== false, // 默认无头模式，可在配置中覆盖
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        viewport: task.config?.browser?.viewport || { width: 1920, height: 1080 },
        userAgent: task.config?.browser?.userAgent,
      });

      page = await context.newPage();

      console.log(`[WebRpaManager] Playwright 已启动，开始执行 ${task.steps.length} 个步骤`);

      // 执行所有步骤
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepStart = new Date().toISOString();

        try {
          console.log(`[WebRpaManager] 执行步骤 ${i + 1}/${task.steps.length}: ${step.action}`);
          await this.executeStep(step, page);

          const stepEnd = new Date().toISOString();
          stepLogs.push({
            stepId: step.id,
            stepIndex: i,
            success: true,
            startTime: stepStart,
            endTime: stepEnd,
            duration: new Date(stepEnd).getTime() - new Date(stepStart).getTime(),
          });

          stepsExecuted++;
        } catch (err) {
          const stepEnd = new Date().toISOString();
          const errorMessage = err instanceof Error ? err.message : String(err);

          stepLogs.push({
            stepId: step.id,
            stepIndex: i,
            success: false,
            startTime: stepStart,
            endTime: stepEnd,
            duration: new Date(stepEnd).getTime() - new Date(stepStart).getTime(),
            error: errorMessage,
          });

          error = errorMessage;

          // 根据配置决定是否继续
          if (!task.config?.errorHandling?.continueOnError) {
            break;
          }
        }
      }

      const endTime = new Date().toISOString();
      const result: RpaExecutionResult = {
        success: !error,
        stepsExecuted,
        totalSteps: task.steps.length,
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        error,
        stepLogs,
      };

      // 更新任务状态
      task.status = error ? 'error' : 'completed';
      task.executionResult = result;
      this.storage.saveTask(task);

      console.log(`[WebRpaManager] RPA 任务执行完成: ${taskId}, 成功: ${!error}`);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const endTime = new Date().toISOString();

      task.status = 'error';
      this.storage.saveTask(task);

      console.error(`[WebRpaManager] RPA 任务执行失败: ${taskId}, 错误: ${errorMessage}`);

      return {
        success: false,
        stepsExecuted,
        totalSteps: task.steps.length,
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        error: errorMessage,
        stepLogs,
      };
    } finally {
      // 关闭 Playwright browser
      if (browser) {
        await browser.close();
        console.log(`[WebRpaManager] Playwright browser 已关闭`);
      }

      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 停止正在执行的 RPA 任务
   *
   * @param taskId - 任务 ID
   * @returns 是否成功停止
   */
  stopTask(taskId: string): boolean {
    if (!this.runningTasks.has(taskId)) {
      console.warn(`[WebRpaManager] RPA 任务未在执行: ${taskId}`);
      return false;
    }

    // TODO: 实现实际的停止逻辑
    this.runningTasks.delete(taskId);

    const task = this.getTask(taskId);
    if (task) {
      task.status = 'idle';
      this.storage.saveTask(task);
    }

    console.log(`[WebRpaManager] RPA 任务已停止: ${taskId}`);
    return true;
  }

  /**
   * 检查 RPA 任务是否存在
   *
   * @param taskId - 任务 ID
   * @returns 是否存在
   */
  taskExists(taskId: string): boolean {
    return this.storage.taskExists(taskId);
  }

  // ==================== 私有方法 ====================

  /**
   * 为步骤生成唯一 ID
   */
  private generateStepIds(steps: Omit<RpaStep, 'id' | 'executedAt' | 'result' | 'error'>[]): RpaStep[] {
    return steps.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
    }));
  }

  /**
   * 执行单个步骤 - 使用 Playwright 实现实际的浏览器自动化
   */
  private async executeStep(step: RpaStep, page: any): Promise<void> {
    const { action, params } = step;

    console.log(`[WebRpaManager] 执行步骤: ${action}`, params);

    switch (action) {
      case 'navigate': {
        // 导航到指定 URL
        const url = params?.url;
        if (!url) {
          throw new Error('navigate 操作需要 url 参数');
        }
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        break;
      }

      case 'click': {
        // 点击元素
        const selector = params?.selector;
        if (!selector) {
          throw new Error('click 操作需要 selector 参数');
        }
        await page.click(selector, { timeout: 10000 });
        break;
      }

      case 'type': {
        // 输入文本
        const selector = params?.selector;
        const text = params?.text;
        if (!selector || !text) {
          throw new Error('type 操作需要 selector 和 text 参数');
        }
        await page.fill(selector, text);
        break;
      }

      case 'screenshot': {
        // 截图
        const outputPath = params?.outputPath || `/tmp/screenshot-${Date.now()}.png`;
        await page.screenshot({ path: outputPath, fullPage: params?.fullPage || false });
        console.log(`[WebRpaManager] 截图已保存: ${outputPath}`);
        break;
      }

      case 'evaluate': {
        // 执行 JavaScript
        const script = params?.script;
        if (!script) {
          throw new Error('evaluate 操作需要 script 参数');
        }
        await page.evaluate(script);
        break;
      }

      case 'wait': {
        // 等待
        const duration = params?.duration || 1000; // 默认等待 1 秒
        const selector = params?.selector;

        if (selector) {
          // 等待元素出现
          await page.waitForSelector(selector, { timeout: duration });
        } else {
          // 等待指定时间
          await page.waitForTimeout(duration);
        }
        break;
      }

      case 'scroll': {
        // 滚动页面
        const x = params?.x || 0;
        const y = params?.y || 0;
        await page.evaluate((x: number, y: number) => window.scrollTo(x, y), x, y);
        break;
      }

      case 'hover': {
        // 悬停在元素上
        const selector = params?.selector;
        if (!selector) {
          throw new Error('hover 操作需要 selector 参数');
        }
        await page.hover(selector);
        break;
      }

      case 'select': {
        // 选择下拉框选项
        const selector = params?.selector;
        const value = params?.value;
        if (!selector || !value) {
          throw new Error('select 操作需要 selector 和 value 参数');
        }
        await page.selectOption(selector, value);
        break;
      }

      case 'upload': {
        // 上传文件
        const selector = params?.selector;
        const filePath = params?.filePath;
        if (!selector || !filePath) {
          throw new Error('upload 操作需要 selector 和 filePath 参数');
        }
        await page.setInputFiles(selector, filePath);
        break;
      }

      case 'press': {
        // 按键
        const selector = params?.selector;
        const key = params?.key;
        if (!selector || !key) {
          throw new Error('press 操作需要 selector 和 key 参数');
        }
        await page.press(selector, key);
        break;
      }

      case 'check': {
        // 勾选复选框
        const selector = params?.selector;
        if (!selector) {
          throw new Error('check 操作需要 selector 参数');
        }
        await page.check(selector);
        break;
      }

      case 'uncheck': {
        // 取消勾选复选框
        const selector = params?.selector;
        if (!selector) {
          throw new Error('uncheck 操作需要 selector 参数');
        }
        await page.uncheck(selector);
        break;
      }

      default:
        throw new Error(`不支持的操作: ${action}`);
    }
  }
}
