/**
 * RPA IPC 桥接层
 *
 * @fileoverview 注册 RPA 相关的 IPC 处理器，提供主进程与渲染进程之间的通信接口
 * @author Ccclaw Team
 * @version 1.0
 */

import { ipcMain } from 'electron';
import type {
  RpaTask,
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  RpaExecutionResult,
  ScreenCaptureOptions,
  OcrOptions,
  OcrResult,
  ElementRecognitionOptions,
  RecognizedElement,
  WindowQueryOptions,
  WindowInfo,
} from '../../../src/types/rpa';
import { WebRpaManager } from './web-rpa-manager';
import { DesktopRpaManager } from './desktop-rpa-manager';
import { RpaStorage } from './rpa-storage';

/**
 * 注册所有 RPA 相关的 IPC 处理器
 * @param webRpaManager - Web RPA 管理器实例
 * @param desktopRpaManager - 桌面 RPA 管理器实例
 */
export function registerRpaIpcHandlers(
  webRpaManager: WebRpaManager,
  desktopRpaManager: DesktopRpaManager
): void {
  // ==================== Web RPA IPC 处理器 ====================

  /**
   * 创建 Web RPA 任务
   * Channel: rpa:web:createTask
   */
  ipcMain.handle('rpa:web:createTask', async (_event, input: RpaTaskCreateInput) => {
    try {
      const task = webRpaManager.createTask(input);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 创建 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 获取 Web RPA 任务
   * Channel: rpa:web:getTask
   */
  ipcMain.handle('rpa:web:getTask', async (_event, taskId: string) => {
    try {
      const task = webRpaManager.getTask(taskId);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 获取 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 获取所有 Web RPA 任务
   * Channel: rpa:web:getAllTasks
   */
  ipcMain.handle('rpa:web:getAllTasks', async (_event, filter?: RpaTaskListFilter) => {
    try {
      const tasks = webRpaManager.getAllTasks(filter);
      return { ok: true, data: tasks };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 获取所有 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 更新 Web RPA 任务
   * Channel: rpa:web:updateTask
   */
  ipcMain.handle('rpa:web:updateTask', async (_event, taskId: string, input: RpaTaskUpdateInput) => {
    try {
      const task = webRpaManager.updateTask(taskId, input);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 更新 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 删除 Web RPA 任务
   * Channel: rpa:web:deleteTask
   */
  ipcMain.handle('rpa:web:deleteTask', async (_event, taskId: string) => {
    try {
      const result = webRpaManager.deleteTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 删除 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 执行 Web RPA 任务
   * Channel: rpa:web:executeTask
   */
  ipcMain.handle('rpa:web:executeTask', async (_event, taskId: string) => {
    try {
      const result = await webRpaManager.executeTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 执行 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 停止 Web RPA 任务
   * Channel: rpa:web:stopTask
   */
  ipcMain.handle('rpa:web:stopTask', async (_event, taskId: string) => {
    try {
      const result = webRpaManager.stopTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 停止 Web RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  // ==================== 桌面 RPA IPC 处理器 ====================

  /**
   * 创建桌面 RPA 任务
   * Channel: rpa:desktop:createTask
   */
  ipcMain.handle('rpa:desktop:createTask', async (_event, input: RpaTaskCreateInput) => {
    try {
      const task = desktopRpaManager.createTask(input);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 创建桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 获取桌面 RPA 任务
   * Channel: rpa:desktop:getTask
   */
  ipcMain.handle('rpa:desktop:getTask', async (_event, taskId: string) => {
    try {
      const task = desktopRpaManager.getTask(taskId);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 获取桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 获取所有桌面 RPA 任务
   * Channel: rpa:desktop:getAllTasks
   */
  ipcMain.handle('rpa:desktop:getAllTasks', async (_event, filter?: RpaTaskListFilter) => {
    try {
      const tasks = desktopRpaManager.getAllTasks(filter);
      return { ok: true, data: tasks };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 获取所有桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 更新桌面 RPA 任务
   * Channel: rpa:desktop:updateTask
   */
  ipcMain.handle('rpa:desktop:updateTask', async (_event, taskId: string, input: RpaTaskUpdateInput) => {
    try {
      const task = desktopRpaManager.updateTask(taskId, input);
      return { ok: true, data: task };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 更新桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 删除桌面 RPA 任务
   * Channel: rpa:desktop:deleteTask
   */
  ipcMain.handle('rpa:desktop:deleteTask', async (_event, taskId: string) => {
    try {
      const result = desktopRpaManager.deleteTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 删除桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 执行桌面 RPA 任务
   * Channel: rpa:desktop:executeTask
   */
  ipcMain.handle('rpa:desktop:executeTask', async (_event, taskId: string) => {
    try {
      const result = await desktopRpaManager.executeTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 执行桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 停止桌面 RPA 任务
   * Channel: rpa:desktop:stopTask
   */
  ipcMain.handle('rpa:desktop:stopTask', async (_event, taskId: string) => {
    try {
      const result = desktopRpaManager.stopTask(taskId);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 停止桌面 RPA 任务失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 捕获屏幕
   * Channel: rpa:desktop:captureScreen
   */
  ipcMain.handle('rpa:desktop:captureScreen', async (_event, options: ScreenCaptureOptions) => {
    try {
      const imagePath = await desktopRpaManager.captureScreen(options);
      return { ok: true, data: imagePath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 捕获屏幕失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * OCR 识别文字
   * Channel: rpa:desktop:recognizeText
   */
  ipcMain.handle('rpa:desktop:recognizeText', async (_event, imagePath: string, options?: OcrOptions) => {
    try {
      const results = await desktopRpaManager.recognizeText(imagePath, options);
      return { ok: true, data: results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] OCR 识别失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 查找元素
   * Channel: rpa:desktop:findElement
   */
  ipcMain.handle('rpa:desktop:findElement', async (_event, options: ElementRecognitionOptions) => {
    try {
      const elements = await desktopRpaManager.findElement(options);
      return { ok: true, data: elements };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 查找元素失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 鼠标点击
   * Channel: rpa:desktop:click
   */
  ipcMain.handle('rpa:desktop:click', async (_event, x: number, y: number, options?: { button?: 'left' | 'right' | 'middle'; double?: boolean }) => {
    try {
      await desktopRpaManager.click(x, y, options);
      return { ok: true, data: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 鼠标点击失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 键盘输入
   * Channel: rpa:desktop:type
   */
  ipcMain.handle('rpa:desktop:type', async (_event, text: string, options?: { delay?: number }) => {
    try {
      await desktopRpaManager.type(text, options);
      return { ok: true, data: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 键盘输入失败:', message);
      return { ok: false, error: message };
    }
  });

  /**
   * 获取窗口列表
   * Channel: rpa:desktop:getWindows
   */
  ipcMain.handle('rpa:desktop:getWindows', async (_event, options?: WindowQueryOptions) => {
    try {
      const windows = await desktopRpaManager.getWindows(options);
      return { ok: true, data: windows };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[RpaIPC] 获取窗口列表失败:', message);
      return { ok: false, error: message };
    }
  });

  console.log('[RpaIPC] RPA IPC handlers 注册完成');
}

/**
 * 清理 RPA IPC 处理器
 * 用于在应用关闭时清理资源
 */
export function unregisterRpaIpcHandlers(): void {
  // 移除所有 RPA 相关的 IPC 处理器
  const channels = [
    'rpa:web:createTask',
    'rpa:web:getTask',
    'rpa:web:getAllTasks',
    'rpa:web:updateTask',
    'rpa:web:deleteTask',
    'rpa:web:executeTask',
    'rpa:web:stopTask',
    'rpa:desktop:createTask',
    'rpa:desktop:getTask',
    'rpa:desktop:getAllTasks',
    'rpa:desktop:updateTask',
    'rpa:desktop:deleteTask',
    'rpa:desktop:executeTask',
    'rpa:desktop:stopTask',
    'rpa:desktop:captureScreen',
    'rpa:desktop:recognizeText',
    'rpa:desktop:findElement',
    'rpa:desktop:click',
    'rpa:desktop:type',
    'rpa:desktop:getWindows',
  ];

  for (const channel of channels) {
    ipcMain.removeHandler?.(channel);
  }

  console.log('[RpaIPC] RPA IPC handlers 已清理');
}
