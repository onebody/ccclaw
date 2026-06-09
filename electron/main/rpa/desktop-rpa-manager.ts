/**
 * 桌面 RPA 管理器
 *
 * @fileoverview 提供桌面 RPA（窗口自动化）功能的业务逻辑管理
 * @author Ccclaw Team
 * @version 1.0
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import type {
  RpaTask,
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  RpaExecutionResult,
  ScreenCaptureOptions,
  OcrOptions,
  OcrResult,
  OcrPreprocessingOptions,
  ElementRecognitionOptions,
  RecognizedElement,
  WindowQueryOptions,
  WindowInfo,
} from '../../../src/types/rpa';
import { RpaStorage } from './rpa-storage';

// 动态导入第三方库
let screenshot: any;
let Tesseract: any;
let robot: any;
let Jimp: any;

// 尝试加载截图库
try {
  screenshot = require('screenshot-desktop');
} catch (err) {
  console.warn('[DesktopRpaManager] screenshot-desktop 未安装，屏幕捕获功能将不可用');
}

// 尝试加载 OCR 库
try {
  Tesseract = require('tesseract.js');
} catch (err) {
  console.warn('[DesktopRpaManager] tesseract.js 未安装，OCR 功能将不可用');
}

// 尝试加载输入模拟库
try {
  robot = require('robotjs');
} catch (err) {
  console.warn('[DesktopRpaManager] robotjs 未安装，鼠标键盘模拟功能将不可用');
}

// 尝试加载图像处理库
try {
  Jimp = require('jimp');
} catch (err) {
  console.warn('[DesktopRpaManager] jimp 未安装，图像匹配功能将不可用');
}

/**
 * DesktopRpaManager 类 - 桌面 RPA 业务逻辑层
 * 负责桌面 RPA 任务的创建、查询、更新、删除和执行
 */
export class DesktopRpaManager {
  /** RPA 数据存储实例 */
  private storage: RpaStorage;
  /** 正在执行的任务 */
  private runningTasks: Map<string, boolean> = new Map();

  /**
   * 构造函数
   * @param storage - RpaStorage 实例
   */
  constructor(storage: RpaStorage) {
    this.storage = storage;
  }

  /**
   * 创建新 RPA 任务
   */
  createTask(input: RpaTaskCreateInput): RpaTask {
    // 参数验证
    if (!input.name || input.name.trim() === '') {
      throw new Error('RPA 任务名称不能为空');
    }

    if (!input.type || input.type !== 'desktop') {
      throw new Error('任务类型必须为 desktop');
    }

    // 生成唯一 ID 和时间戳
    const now = new Date().toISOString();
    const taskId = crypto.randomUUID();

    // 构建完整的任务对象
    const task: RpaTask = {
      id: taskId,
      name: input.name,
      description: input.description || '',
      type: 'desktop',
      status: 'idle',
      steps: input.steps ? this.generateStepIds(input.steps) : [],
      config: input.config,
      createdAt: now,
      updatedAt: now,
    };

    // 保存到存储
    this.storage.saveTask(task);

    console.log(`[DesktopRpaManager] 创建 RPA 任务成功: ${task.id} (${task.name})`);

    return task;
  }

  /**
   * 获取单个 RPA 任务
   */
  getTask(taskId: string): RpaTask | null {
    if (!taskId || taskId.trim() === '') {
      console.warn('[DesktopRpaManager] 获取 RPA 任务失败: taskId 不能为空');
      return null;
    }

    return this.storage.loadTask(taskId);
  }

  /**
   * 获取所有 RPA 任务（支持筛选）
   */
  getAllTasks(filter?: RpaTaskListFilter): RpaTask[] {
    // 加载所有任务
    let tasks = this.storage.loadAllTasks().filter((task) => task.type === 'desktop');

    // 应用筛选条件
    if (filter) {
      // 按状态筛选
      if (filter.status) {
        tasks = tasks.filter((task) => task.status === filter.status);
      }

      // 按关键词搜索
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
   */
  updateTask(taskId: string, input: RpaTaskUpdateInput): RpaTask | null {
    if (!taskId || taskId.trim() === '') {
      console.warn('[DesktopRpaManager] 更新 RPA 任务失败: taskId 不能为空');
      return null;
    }

    // 加载现有配置
    const existing = this.storage.loadTask(taskId);
    if (!existing) {
      console.warn(`[DesktopRpaManager] 更新 RPA 任务失败: 任务不存在 (${taskId})`);
      return null;
    }

    // 验证更新后的名称
    if (input.name !== undefined && (!input.name || input.name.trim() === '')) {
      throw new Error('RPA 任务名称不能为空');
    }

    // 合并更新字段
    const updated = {
      id: existing.id,
      name: input.name !== undefined ? input.name : existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      type: 'desktop' as const,
      status: input.status !== undefined ? input.status : existing.status,
      steps: input.steps !== undefined ? this.generateStepIds(input.steps) : existing.steps,
      config: input.config !== undefined ? input.config : existing.config,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      lastExecutedAt: existing.lastExecutedAt,
      executionResult: existing.executionResult,
    };

    // 如果更新了步骤，重新生成步骤 ID
    if (input.steps) {
      updated.steps = this.generateStepIds(input.steps);
    }

    // 保存到存储
    this.storage.saveTask(updated);

    console.log(`[DesktopRpaManager] 更新 RPA 任务成功: ${updated.id} (${updated.name})`);

    return updated;
  }

  /**
   * 删除 RPA 任务
   */
  deleteTask(taskId: string): boolean {
    if (!taskId || taskId.trim() === '') {
      console.warn('[DesktopRpaManager] 删除 RPA 任务失败: taskId 不能为空');
      return false;
    }

    const result = this.storage.deleteTask(taskId);

    if (result) {
      console.log(`[DesktopRpaManager] 删除 RPA 任务成功: ${taskId}`);
    } else {
      console.warn(`[DesktopRpaManager] 删除 RPA 任务失败: 任务不存在 (${taskId})`);
    }

    return result;
  }

  /**
   * 执行 RPA 任务
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
    const stepLogs: RpaExecutionResult['stepLogs'] = [];
    let stepsExecuted = 0;
    let error: string | undefined;

    try {
      console.log(`[DesktopRpaManager] 开始执行 RPA 任务: ${taskId}`);

      // TODO: 实现实际的桌面 RPA 执行逻辑
      // 这里先返回模拟结果
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepStart = new Date().toISOString();

        try {
          console.log(`[DesktopRpaManager] 执行步骤 ${i + 1}/${task.steps.length}: ${step.action}`);
          await this.executeStep(step);

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

      console.log(`[DesktopRpaManager] RPA 任务执行完成: ${taskId}, 成功: ${!error}`);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const endTime = new Date().toISOString();

      task.status = 'error';
      this.storage.saveTask(task);

      console.error(`[DesktopRpaManager] RPA 任务执行失败: ${taskId}, 错误: ${errorMessage}`);

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
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 停止正在执行的 RPA 任务
   */
  stopTask(taskId: string): boolean {
    if (!this.runningTasks.has(taskId)) {
      console.warn(`[DesktopRpaManager] RPA 任务未在执行: ${taskId}`);
      return false;
    }

    // TODO: 实现实际的停止逻辑
    this.runningTasks.delete(taskId);

    const task = this.getTask(taskId);
    if (task) {
      task.status = 'idle';
      this.storage.saveTask(task);
    }

    console.log(`[DesktopRpaManager] RPA 任务已停止: ${taskId}`);
    return true;
  }

  /**
   * 检查 RPA 任务是否存在
   */
  taskExists(taskId: string): boolean {
    return this.storage.taskExists(taskId);
  }

  // ==================== 桌面 RPA 特定方法 ====================

  /**
   * 捕获屏幕
   * 使用 screenshot-desktop 库实现屏幕捕获
   */
  async captureScreen(options: ScreenCaptureOptions = { type: 'screen' }): Promise<string> {
    console.log('[DesktopRpaManager] 捕获屏幕', options);

    if (!screenshot) {
      throw new Error('screenshot-desktop 库未安装，无法捕获屏幕');
    }

    try {
      // 生成文件名
      const timestamp = new Date().getTime();
      const filename = `screenshot-${timestamp}.png`;
      const outputDir = os.tmpdir();
      const outputPath = path.join(outputDir, filename);

      // 捕获屏幕
      // screenshot-desktop 返回 Promise<string[]> (文件名数组)
      const displays = await screenshot({ format: options.format || 'png' });

      if (!displays || displays.length === 0) {
        throw new Error('未检测到显示器');
      }

      // 如果指定了窗口，使用指定的；否则使用主显示器
      const displayIndex = options.windowHandle ? 0 : 0; // 暂不支持多显示器选择
      const sourcePath = displays[Math.min(displayIndex, displays.length - 1)];

      // 移动文件到指定位置
      const fs = require('fs');
      fs.copyFileSync(sourcePath, outputPath);

      // 如果指定了区域，需要裁剪图片
      if (options.region) {
        // TODO: 实现图片裁剪功能
        console.log('[DesktopRpaManager] 区域截图功能待实现');
      }

      console.log(`[DesktopRpaManager] 屏幕捕获成功: ${outputPath}`);

      return outputPath;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 屏幕捕获失败: ${error}`);
      throw new Error(`屏幕捕获失败: ${error}`);
    }
  }

  /**
   * OCR 识别文字
   * 使用 Tesseract.js 实现 OCR 识别
   * 支持图像预处理、多种 PSM 模式、多语言识别
   */
  async recognizeText(imagePath: string, options: OcrOptions = {}): Promise<OcrResult[]> {
    console.log('[DesktopRpaManager] OCR 识别文字', imagePath);

    if (!Tesseract) {
      throw new Error('tesseract.js 库未安装，无法识别文字');
    }

    const fs = require('fs');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`图片文件不存在: ${imagePath}`);
    }

    const startTime = Date.now();

    try {
      // Step 1: 图像预处理
      let processedImagePath = imagePath;
      let imageSize = { width: 0, height: 0 };

      if (options.preprocessing) {
        processedImagePath = await this.preprocessImage(imagePath, options.preprocessing);
        // 获取处理后的图像尺寸
        const processedImg = await Jimp.read(fs.readFileSync(processedImagePath));
        imageSize = { width: processedImg.width, height: processedImg.height };
      } else {
        // 获取原始图像尺寸
        const origImg = await Jimp.read(fs.readFileSync(imagePath));
        imageSize = { width: origImg.width, height: origImg.height };
      }

      // Step 2: 创建 Tesseract worker 并配置
      const worker = await Tesseract.createWorker({
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`[DesktopRpaManager] Tesseract: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // 设置语言（支持多语言）
      const language = options.language || 'eng';
      console.log(`[DesktopRpaManager] 加载语言包: ${language}`);
      await worker.loadLanguage(language);

      // 初始化引擎，配置 PSM 模式
      const psmMode = this.mapPsmMode(options.psmMode || 'auto');
      const oemMode = this.mapOemMode(options.oemMode || 'neuralLstm');

      console.log(`[DesktopRpaManager] 初始化 Tesseract: PSM=${psmMode}, OEM=${oemMode}`);
      await worker.initialize(language, oemMode, {
        config: `--psm ${psmMode}`,
      });

      // Step 3: 执行识别
      console.log(`[DesktopRpaManager] 开始 OCR 识别...`);
      const { data } = await worker.recognize(processedImagePath);

      // 关闭 worker
      await worker.terminate();

      // Step 4: 后处理 - 过滤低置信度结果
      const minConfidence = options.minConfidence ?? 0.5;
      const processingTime = Date.now() - startTime;

      console.log(`[DesktopRpaManager] OCR 识别完成: ${data.words?.length || 0} 个词，耗时 ${processingTime}ms`);

      // 转换结果格式
      const results: OcrResult[] = [];

      if (options.detailed && data.blocks) {
        // 详细模式：按块返回
        for (const block of data.blocks) {
          const blockText = block.paragraphs
            ?.map((p: any) => p.lines?.map((l: any) => l.text).join(' ') || '')
            .join('\n') || '';

          if (blockText.trim()) {
            results.push({
              text: blockText,
              bbox: {
                x: block.bbox.x0,
                y: block.bbox.y0,
                width: block.bbox.x1 - block.bbox.x0,
                height: block.bbox.y1 - block.bbox.y0,
              },
              confidence: (block.confidence || 0) / 100,
              blocks: [{
                text: blockText,
                bbox: {
                  x: block.bbox.x0,
                  y: block.bbox.y0,
                  width: block.bbox.x1 - block.bbox.x0,
                  height: block.bbox.y1 - block.bbox.y0,
                },
                confidence: (block.confidence || 0) / 100,
                lines: block.paragraphs?.flatMap((p: any) =>
                  p.lines?.map((l: any) => ({
                    text: l.text,
                    bbox: {
                      x: l.bbox.x0,
                      y: l.bbox.y0,
                      width: l.bbox.x1 - l.bbox.x0,
                      height: l.bbox.y1 - l.bbox.y0,
                    },
                    confidence: (l.confidence || 0) / 100,
                  })) || []
                ) || [],
              }],
              stats: {
                processingTime,
                imageSize,
                languages: language,
              },
            });
          }
        }
      }

      // 如果没有详细结果或只需要词级结果
      if (results.length === 0 && data.words && data.words.length > 0) {
        for (const word of data.words) {
          const wordConfidence = (word.confidence || 0) / 100;

          // 过滤低置信度结果
          if (wordConfidence < minConfidence) {
            continue;
          }

          results.push({
            text: word.text,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            },
            confidence: wordConfidence,
            stats: {
              processingTime,
              imageSize,
              languages: language,
            },
          });
        }
      }

      // 如果没有词级结果，返回整个文本
      if (results.length === 0 && data.text) {
        results.push({
          text: data.text,
          bbox: { x: 0, y: 0, width: imageSize.width, height: imageSize.height },
          confidence: (data.confidence || 0) / 100,
          stats: {
            processingTime,
            imageSize,
            languages: language,
          },
        });
      }

      console.log(`[DesktopRpaManager] OCR 返回 ${results.length} 个结果（置信度 >= ${(minConfidence * 100).toFixed(0)}%）`);

      // 清理临时文件
      if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }

      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] OCR 识别失败: ${error}`);
      throw new Error(`OCR 识别失败: ${error}`);
    }
  }

  /**
   * 图像预处理 - 使用 jimp 提高 OCR 识别率
   */
  private async preprocessImage(imagePath: string, options: OcrPreprocessingOptions): Promise<string> {
    if (!Jimp) {
      console.warn('[DesktopRpaManager] jimp 未安装，跳过图像预处理');
      return imagePath;
    }

    const fs = require('fs');
    const startTime = Date.now();
    console.log('[DesktopRpaManager] 开始图像预处理...');

    try {
      const image = await Jimp.read(fs.readFileSync(imagePath));
      let processed = image;

      // 1. 缩放（用于提高小字体识别）
      if (options.scaleFactor && options.scaleFactor !== 1) {
        const newWidth = Math.round(processed.width * options.scaleFactor);
        const newHeight = Math.round(processed.height * options.scaleFactor);
        processed = processed.resize({ w: newWidth, h: newHeight });
        console.log(`[DesktopRpaManager] 缩放: ${processed.width}x${processed.height} -> ${newWidth}x${newHeight}`);
      }

      // 2. 灰度转换
      if (options.grayscale !== false) {
        // jimp v1 使用 contrast 方法配合 lightness
        processed = processed.convolute([
          [0.299, 0.587, 0.114, 0, 0],
          [0.299, 0.587, 0.114, 0, 0],
          [0.299, 0.587, 0.114, 0, 0],
          [0, 0, 0, 1, 0],
        ]);
      }

      // 3. 对比度增强
      if (options.contrastEnhance) {
        const level = (options.contrastLevel || 5) / 5; // 1-10 映射到 0.2-2
        processed = processed.contrast(level - 1); // jimp 的 contrast 是 -1 到 1
      }

      // 4. 二值化
      if (options.binarize) {
        const threshold = options.binarizeThreshold ?? 128;
        // 使用阈值进行二值化
        processed = await this.binarizeImage(processed, threshold);
      }

      // 5. 去噪（简单的中值滤波）
      if (options.denoise) {
        processed = this.denoiseImage(processed);
      }

      // 6. 锐化
      if (options.sharpen) {
        // 使用锐化卷积核
        processed = processed.convolute([
          [0, -1, 0],
          [-1, 5, -1],
          [0, -1, 0],
        ]);
      }

      // 保存处理后的图像
      const outputPath = imagePath.replace(/\.png$/i, '-processed.png').replace(/\.jpg$/i, '-processed.jpg').replace(/\.jpeg$/i, '-processed.jpeg');
      await processed.write(outputPath);

      const elapsed = Date.now() - startTime;
      console.log(`[DesktopRpaManager] 图像预处理完成，耗时 ${elapsed}ms，保存到: ${outputPath}`);

      return outputPath;
    } catch (err) {
      console.warn('[DesktopRpaManager] 图像预处理失败:', err);
      return imagePath;
    }
  }

  /**
   * 图像二值化
   */
  private async binarizeImage(image: any, threshold: number): Promise<any> {
    const width = image.width;
    const height = image.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = image.getPixelColor(x, y);
        // 提取 RGB
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        // 计算灰度
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // 二值化
        const newColor = gray > threshold ? 0xFFFFFFFF : 0x000000FF;
        image.setPixelColor(newColor, x, y);
      }
    }

    return image;
  }

  /**
   * 图像去噪（简单中值滤波）
   */
  private denoiseImage(image: any): any {
    const width = image.width;
    const height = image.height;
    const newData = new Uint32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const neighbors: number[] = [];

        // 收集 3x3 邻域的像素值
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            neighbors.push(image.getPixelColor(nx, ny));
          }
        }

        // 排序并取中值
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // 3x3 邻域的中值

        newData[y * width + x] = median;
      }
    }

    // 应用去噪结果
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        image.setPixelColor(newData[y * width + x], x, y);
      }
    }

    return image;
  }

  /**
   * 映射 PSM 模式字符串到数字
   */
  private mapPsmMode(mode?: string): number {
    const psmMap: Record<string, number> = {
      'auto': 3,
      'autoWithOcr': 1,
      'autoOnlyOsd': 2,
      'normal': 3,
      'singleColumn': 4,
      'uniformBlock': 5,
      'singleLine': 6,
      'singleWord': 7,
      'singleChar': 8,
      'sparseText': 9,
      'sparseTextOcr': 10,
      'rawLine': 11,
    };
    return psmMap[mode || 'auto'] ?? 3;
  }

  /**
   * 映射 OEM 模式字符串到数字
   */
  private mapOemMode(mode?: string): number {
    const oemMap: Record<string, number> = {
      'legacy': 0,
      'neuralLstm': 1,
      'legacyPlus': 2,
      'default': 3,
    };
    return oemMap[mode || 'neuralLstm'] ?? 1;
  }

  /**
   * 图像匹配查找元素
   * 使用像素比较算法在屏幕截图中查找与模板图像匹配的区域
   */
  async findElementByImage(
    screenshotPath: string,
    templatePath: string,
    options: {
      threshold?: number;      // 匹配阈值 (0-1)
      scale?: number;         // 模板缩放范围
      multiple?: boolean;    // 是否返回多个匹配结果
    } = {}
  ): Promise<RecognizedElement[]> {
    console.log('[DesktopRpaManager] 图像匹配查找元素');

    if (!Jimp) {
      throw new Error('jimp 库未安装，无法使用图像匹配功能');
    }

    const fs = require('fs');
    if (!fs.existsSync(screenshotPath)) {
      throw new Error(`截图文件不存在: ${screenshotPath}`);
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板文件不存在: ${templatePath}`);
    }

    try {
      const threshold = options.threshold ?? 0.8;  // 默认阈值 80%
      const scale = options.scale ?? 0.1;          // 缩放范围 ±10%
      const multiple = options.multiple ?? false;  // 默认只返回最佳匹配

      console.log(`[DesktopRpaManager] 加载图像: screenshot=${screenshotPath}, template=${templatePath}`);

      // 加载图像 - jimp v1 需要先读取文件为 Buffer
      const fs = require('fs');
      const screenshotBuf = fs.readFileSync(screenshotPath);
      const templateBuf = fs.readFileSync(templatePath);
      const screenshot = await Jimp.read(screenshotBuf);
      const template = await Jimp.read(templateBuf);

      const screenWidth = screenshot.width;
      const screenHeight = screenshot.height;
      const templateWidth = template.width;
      const templateHeight = template.height;

      console.log(`[DesktopRpaManager] 图像尺寸: 截图=${screenWidth}x${screenHeight}, 模板=${templateWidth}x${templateHeight}`);

      // 检查模板是否比截图大
      if (templateWidth > screenWidth || templateHeight > screenHeight) {
        throw new Error('模板图像比截图大，无法匹配');
      }

      // 转换为灰度以提高匹配效率和准确性
      const screenGray = this.toGrayscale(screenshot);
      const templateGray = this.toGrayscale(template);

      const results: RecognizedElement[] = [];
      const matches: { x: number; y: number; similarity: number }[] = [];

      // 滑窗匹配算法
      // 步长设为模板尺寸的 10%，提高效率
      const stepX = Math.max(1, Math.floor(templateWidth * 0.1));
      const stepY = Math.max(1, Math.floor(templateHeight * 0.1));

      for (let y = 0; y <= screenHeight - templateHeight; y += stepY) {
        for (let x = 0; x <= screenWidth - templateWidth; x += stepX) {
          const similarity = this.compareRegions(screenGray, templateGray, x, y, templateWidth, templateHeight);

          if (similarity >= threshold) {
            matches.push({ x, y, similarity });

            if (!multiple && similarity > threshold) {
              // 找到足够好的匹配，立即返回
              console.log(`[DesktopRpaManager] 找到匹配: (${x}, ${y}), 相似度=${(similarity * 100).toFixed(1)}%`);
            }
          }
        }
      }

      // 如果找到了匹配，进行细粒度搜索以找到精确位置
      if (matches.length > 0 && !multiple) {
        // 按相似度排序
        matches.sort((a, b) => b.similarity - a.similarity);
        const bestMatch = matches[0];

        // 在最佳匹配位置附近进行细粒度搜索
        const refined = this.refineMatch(screenGray, templateGray, bestMatch.x, bestMatch.y, templateWidth, templateHeight);

        results.push({
          id: `img-${Date.now()}`,
          type: 'image',
          text: `matched_image_${templateWidth}x${templateHeight}`,
          bounds: {
            x: refined.x,
            y: refined.y,
            width: templateWidth,
            height: templateHeight,
          },
          confidence: refined.similarity,
        });
      } else if (matches.length > 0 && multiple) {
        // 返回多个匹配
        for (const match of matches.slice(0, 10)) { // 最多返回10个
          results.push({
            id: `img-${Date.now()}-${results.length}`,
            type: 'image',
            text: `matched_image_${templateWidth}x${templateHeight}`,
            bounds: {
              x: match.x,
              y: match.y,
              width: templateWidth,
              height: templateHeight,
            },
            confidence: match.similarity,
          });
        }
      }

      console.log(`[DesktopRpaManager] 图像匹配完成: 找到 ${results.length} 个匹配项`);

      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 图像匹配失败: ${error}`);
      throw new Error(`图像匹配失败: ${error}`);
    }
  }

  /**
   * 将图像转换为灰度
   * jimp v1 使用 ARGB 格式: 0xAARRGGBB
   */
  private toGrayscale(image: any): any {
    const width = image.width;
    const height = image.height;
    const gray = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = image.getPixelColor(x, y);
        // jimp v1 使用 ARGB 格式
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        // 使用 luminance 公式: 0.299*R + 0.587*G + 0.114*B
        gray[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }
    }

    return { width, height, data: gray };
  }

  /**
   * 比较两个区域的相似度（SSD - 平方差和）
   * 返回 0-1 的相似度，1 表示完全匹配
   */
  private compareRegions(screen: any, template: any, sx: number, sy: number, tw: number, th: number): number {
    let ssd = 0;
    const maxDiff = tw * th * 255 * 255; // 最大可能的差值

    // 从屏幕提取区域
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const screenPixel = screen.data[(sy + y) * screen.width + (sx + x)];
        const templatePixel = template.data[y * template.width + x];
        const diff = screenPixel - templatePixel;
        ssd += diff * diff;
      }
    }

    // 转换为相似度 (1 = 完全匹配, 0 = 完全不匹配)
    return 1 - (ssd / maxDiff);
  }

  /**
   * 在粗略匹配位置附近进行细粒度搜索
   */
  private refineMatch(screen: any, template: any, roughX: number, roughY: number, tw: number, th: number): { x: number; y: number; similarity: number } {
    let bestSimilarity = 0;
    let bestX = roughX;
    let bestY = roughY;

    // 在粗略位置周围 20% 模板尺寸的范围内搜索
    const searchRangeX = Math.floor(tw * 0.2);
    const searchRangeY = Math.floor(th * 0.2);

    const startX = Math.max(0, roughX - searchRangeX);
    const startY = Math.max(0, roughY - searchRangeY);
    const endX = Math.min(screen.width - tw, roughX + searchRangeX);
    const endY = Math.min(screen.height - th, roughY + searchRangeY);

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const similarity = this.compareRegions(screen, template, x, y, tw, th);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestX = x;
          bestY = y;
        }
      }
    }

    return { x: bestX, y: bestY, similarity: bestSimilarity };
  }

  /**
   * 查找元素
   * 支持多种识别方式：OCR 文本识别、图像匹配
   */
  async findElement(options: ElementRecognitionOptions): Promise<RecognizedElement[]> {
    console.log('[DesktopRpaManager] 查找元素', options);

    const results: RecognizedElement[] = [];

    try {
      if (options.strategy === 'ocr') {
        // OCR 文本识别方式
        const imagePath = options.templateImage || await this.captureScreen();

        if (!Tesseract) {
          throw new Error('tesseract.js 库未安装，无法使用 OCR 识别');
        }

        const ocrResults = await this.recognizeText(imagePath, { language: options.query?.text ? 'eng' : 'eng' });

        // 根据查询条件过滤结果
        if (options.query?.text) {
          const query = options.query.text.toLowerCase();
          for (const result of ocrResults) {
            if (result.text.toLowerCase().includes(query)) {
              results.push({
                id: `ocr-${Date.now()}`,
                type: 'text',
                text: result.text,
                bounds: {
                  x: result.bbox.x,
                  y: result.bbox.y,
                  width: result.bbox.width,
                  height: result.bbox.height,
                },
                confidence: result.confidence,
              });
            }
          }
        }
      } else if (options.strategy === 'image-matching') {
        // 图像匹配方式
        const screenshotPath = options.screenshotPath || await this.captureScreen();
        const templatePath = options.templateImage;

        if (!templatePath) {
          throw new Error('图像匹配需要提供 templateImage 参数');
        }

        const imageResults = await this.findElementByImage(screenshotPath, templatePath, {
          threshold: options.threshold,
          multiple: false,
        });

        results.push(...imageResults);
      } else {
        // feature-detection 方式（待实现）
        console.log('[DesktopRpaManager] 特征检测元素查找功能待实现');
        throw new Error('特征检测元素查找功能尚未实现');
      }

      console.log(`[DesktopRpaManager] 查找元素完成: 找到 ${results.length} 个匹配项`);

      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 查找元素失败: ${error}`);
      throw new Error(`查找元素失败: ${error}`);
    }
  }

  /**
   * 鼠标点击
   * 使用 RobotJS 实现鼠标点击
   */
  async click(x: number, y: number, options: { button?: 'left' | 'right' | 'middle'; double?: boolean; delay?: number } = {}): Promise<void> {
    console.log(`[DesktopRpaManager] 鼠标点击: (${x}, ${y})`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟鼠标点击');
    }

    try {
      // 移动鼠标到指定位置
      robot.moveMouse(x, y);

      // 设置鼠标按钮
      const button = options.button || 'left';
      const robotButton = button === 'left' ? 'left' : button === 'right' ? 'right' : 'middle';

      // 执行点击
      if (options.double) {
        // 双击
        robot.mouseClick(robotButton);
        await new Promise((resolve) => setTimeout(resolve, 50));
        robot.mouseClick(robotButton);
      } else {
        // 单击
        robot.mouseClick(robotButton);
      }

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, options.delay || 50));

      console.log(`[DesktopRpaManager] 鼠标点击成功: (${x}, ${y})`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 鼠标点击失败: ${error}`);
      throw new Error(`鼠标点击失败: ${error}`);
    }
  }

  /**
   * 键盘输入
   * 使用 RobotJS 实现键盘输入
   */
  async type(text: string, options: { delay?: number } = {}): Promise<void> {
    console.log(`[DesktopRpaManager] 键盘输入: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟键盘输入');
    }

    try {
      const delay = options.delay || 50; // 默认延迟 50ms

      // 逐字符输入
      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 处理特殊字符
        if (char === '\n') {
          robot.keyTap('enter');
        } else if (char === '\t') {
          robot.keyTap('tab');
        } else if (char === ' ') {
          robot.keyTap('space');
        } else {
          // 普通字符
          robot.typeString(char);
        }

        // 延迟
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      console.log(`[DesktopRpaManager] 键盘输入成功: 已输入 ${text.length} 个字符`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 键盘输入失败: ${error}`);
      throw new Error(`键盘输入失败: ${error}`);
    }
  }

  /**
   * 鼠标拖拽
   * 从起点拖拽到终点
   */
  async drag(startX: number, startY: number, endX: number, endY: number, options: { button?: 'left' | 'right'; duration?: number; steps?: number } = {}): Promise<void> {
    console.log(`[DesktopRpaManager] 鼠标拖拽: (${startX}, ${startY}) -> (${endX}, ${endY})`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟鼠标拖拽');
    }

    try {
      const button = options.button || 'left';
      const robotButton = button === 'left' ? 'left' : 'right';
      const duration = options.duration || 500; // 默认拖拽持续时间 500ms
      const steps = options.steps || 10;        // 默认步数

      // 移动到起点
      robot.moveMouse(startX, startY);

      // 按下鼠标
      robot.mousePress(robotButton);

      // 分步移动到终点
      const deltaX = (endX - startX) / steps;
      const deltaY = (endY - startY) / steps;
      const stepDuration = duration / steps;

      for (let i = 1; i <= steps; i++) {
        const currentX = Math.round(startX + deltaX * i);
        const currentY = Math.round(startY + deltaY * i);
        robot.moveMouse(currentX, currentY);

        if (stepDuration > 0) {
          await new Promise((resolve) => setTimeout(resolve, stepDuration));
        }
      }

      // 释放鼠标
      robot.mouseRelease(robotButton);

      console.log(`[DesktopRpaManager] 鼠标拖拽成功`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 鼠标拖拽失败: ${error}`);
      throw new Error(`鼠标拖拽失败: ${error}`);
    }
  }

  /**
   * 鼠标滚轮滚动
   */
  async scroll(x: number, y: number, deltaX: number, deltaY: number, options: { smooth?: boolean } = {}): Promise<void> {
    console.log(`[DesktopRpaManager] 鼠标滚轮滚动: deltaX=${deltaX}, deltaY=${deltaY}`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟鼠标滚轮');
    }

    try {
      // 可选：先移动鼠标到位置
      if (x !== undefined && y !== undefined) {
        robot.moveMouse(x, y);
      }

      // 执行滚轮滚动
      // robotjs 的 scrollMouse 需要 x 和 y 方向的值
      // 正值向上/右，负值向下/左
      if (deltaY !== 0) {
        robot.scrollMouse(0, deltaY > 0 ? 'up' : 'down');
      }
      if (deltaX !== 0) {
        robot.scrollMouse(deltaX > 0 ? 'right' : 'left', 0);
      }

      console.log(`[DesktopRpaManager] 鼠标滚轮滚动成功`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 鼠标滚轮滚动失败: ${error}`);
      throw new Error(`鼠标滚轮滚动失败: ${error}`);
    }
  }

  /**
   * 按下按键
   */
  async keyPress(key: string): Promise<void> {
    console.log(`[DesktopRpaManager] 按下按键: ${key}`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟按键');
    }

    try {
      // robotjs 的按键名称转换
      const robotKey = this.mapKeyToRobotKey(key);
      robot.keyTap(robotKey);

      console.log(`[DesktopRpaManager] 按键成功: ${key}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 按键失败: ${error}`);
      throw new Error(`按键失败: ${error}`);
    }
  }

  /**
   * 按下组合键
   * 支持多种格式: 'ctrl+c', 'command+shift+s', 'ctrl+alt+delete'
   */
  async keyCombo(combo: string): Promise<void> {
    console.log(`[DesktopRpaManager] 按下组合键: ${combo}`);

    if (!robot) {
      throw new Error('robotjs 库未安装，无法模拟组合键');
    }

    try {
      // 解析组合键
      const keys = combo.toLowerCase().split('+').map((k) => k.trim());
      if (keys.length === 0) {
        throw new Error('组合键格式错误');
      }

      // 转换按键名称
      const robotKeys = keys.map((k) => this.mapKeyToRobotKey(k));

      // 分离修饰键和普通键
      const modifiers = robotKeys.slice(0, -1); // 除了最后一个都是修饰键
      const mainKey = robotKeys[robotKeys.length - 1]; // 最后一个是主键

      // 按下修饰键
      for (const mod of modifiers) {
        robot.keyToggle(mod, 'down');
      }

      // 按下主键
      robot.keyTap(mainKey);

      // 释放修饰键
      for (const mod of modifiers.reverse()) {
        robot.keyToggle(mod, 'up');
      }

      console.log(`[DesktopRpaManager] 组合键成功: ${combo}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 组合键失败: ${error}`);
      throw new Error(`组合键失败: ${error}`);
    }
  }

  /**
   * 快捷键（keyCombo 的别名）
   */
  async hotkey(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      throw new Error('快捷键参数不能为空');
    }

    // 单个字符串格式: 'ctrl+c', 'command+shift+s'
    if (keys.length === 1 && keys[0].includes('+')) {
      return this.keyCombo(keys[0]);
    }

    // 多个独立参数格式: 'ctrl', 'c'
    return this.keyCombo(keys.join('+'));
  }

  /**
   * 将按键名称转换为 robotjs 格式
   */
  private mapKeyToRobotKey(key: string): string {
    // 键名映射表
    const keyMap: Record<string, string> = {
      // 字母键
      'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e',
      'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j',
      'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o',
      'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't',
      'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
      // 数字键
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      // 功能键
      'f1': 'f1', 'f2': 'f2', 'f3': 'f3', 'f4': 'f4', 'f5': 'f5',
      'f6': 'f6', 'f7': 'f7', 'f8': 'f8', 'f9': 'f9', 'f10': 'f10',
      'f11': 'f11', 'f12': 'f12',
      // 符号键
      'space': 'space', 'enter': 'enter', 'return': 'return',
      'tab': 'tab', 'escape': 'escape', 'esc': 'escape',
      'backspace': 'backspace', 'delete': 'delete', 'del': 'delete',
      'up': 'up', 'down': 'down', 'left': 'left', 'right': 'right',
      'home': 'home', 'end': 'end', 'pageup': 'pageup', 'pagedown': 'pagedown',
      // 修饰键
      'ctrl': 'control', 'control': 'control', 'alt': 'alt', 'option': 'alt',
      'shift': 'shift', 'meta': 'command', 'command': 'command', 'win': 'command',
      // 特殊键
      'printscreen': 'print_screen', 'snapshot': 'print_screen',
      'pause': 'pause', 'break': 'pause', 'capslock': 'caps_lock',
      'numlock': 'num_lock', 'scrolllock': 'scroll_lock',
    };

    const normalizedKey = key.toLowerCase().trim();
    return keyMap[normalizedKey] || normalizedKey;
  }

  /**
   * 获取窗口列表
   * 使用系统命令获取窗口信息
   */
  async getWindows(options: WindowQueryOptions = {}): Promise<WindowInfo[]> {
    console.log('[DesktopRpaManager] 获取窗口列表');

    const results: WindowInfo[] = [];

    try {
      const platform = os.platform();

      if (platform === 'darwin') {
        // macOS: 使用 AppleScript 获取窗口列表
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        const script = `
          tell application "System Events"
            set windowList to {}
            repeat with proc in (every process whose background only is false)
              try
                repeat with win in (every window of proc)
                  set end of windowList to {name of proc, name of win, id of win}
                end repeat
              end try
            end repeat
            return windowList
          end tell
        `;

        const { stdout } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);

        // 解析输出（简化版）
        const lines = stdout.trim().split('\n');
        for (let i = 0; i < lines.length; i += 3) {
          if (lines[i]) {
            results.push({
              handle: parseInt(lines[i + 2]) || i,
              title: lines[i + 1] || 'Untitled',
              processId: 0, // AppleScript 未返回进程 ID
              processName: lines[i] || 'Unknown',
              bounds: { x: 0, y: 0, width: 0, height: 0 },
              state: 'normal',
              visible: true,
            });
          }
        }
      } else if (platform === 'win32') {
        // Windows: 使用 powershell 获取窗口列表
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        const psScript = `
          Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json
        `;

        const { stdout } = await execPromise(`powershell -Command "${psScript}"`);

        if (stdout.trim()) {
          const processes = JSON.parse(stdout);
          const procList = Array.isArray(processes) ? processes : [processes];

          for (const proc of procList) {
            results.push({
              handle: proc.Id,
              title: proc.MainWindowTitle || 'Untitled',
              processId: proc.Id,
              processName: proc.ProcessName || 'Unknown',
              bounds: { x: 0, y: 0, width: 0, height: 0 },
              state: 'normal',
              visible: true,
            });
          }
        }
      } else {
        // Linux: 使用 wmctrl
        console.log('[DesktopRpaManager] Linux 窗口管理功能待实现');
      }

      // 应用筛选条件
      if (options.processName) {
        const query = options.processName.toLowerCase();
        return results.filter((w) => w.processName.toLowerCase().includes(query));
      }

      if (options.title) {
        const query = options.title.toLowerCase();
        return results.filter((w) => w.title.toLowerCase().includes(query));
      }

      console.log(`[DesktopRpaManager] 获取窗口列表完成: 找到 ${results.length} 个窗口`);

      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DesktopRpaManager] 获取窗口列表失败: ${error}`);
      throw new Error(`获取窗口列表失败: ${error}`);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 为步骤生成唯一 ID
   */
  private generateStepIds(steps: Omit<RpaTask['steps'][0], 'id' | 'executedAt' | 'result' | 'error'>[]): RpaTask['steps'] {
    return steps.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
    }));
  }

  /**
   * 执行单个步骤
   * TODO: 实现实际的执行逻辑
   */
  private async executeStep(step: RpaTask['steps'][0]): Promise<void> {
    console.log(`[DesktopRpaManager] 执行步骤: ${step.action}`, step.params);

    // 根据步骤类型执行不同的操作
    switch (step.action) {
      case 'captureScreen':
        await this.captureScreen(step.params as unknown as ScreenCaptureOptions);
        break;
      case 'click':
        await this.click(step.params.x || 0, step.params.y || 0, { button: step.params.button, double: step.params.double });
        break;
      case 'doubleClick':
        await this.click(step.params.x || 0, step.params.y || 0, { button: 'left', double: true });
        break;
      case 'rightClick':
        await this.click(step.params.x || 0, step.params.y || 0, { button: 'right' });
        break;
      case 'moveMouse':
        if (robot) robot.moveMouse(step.params.x || 0, step.params.y || 0);
        break;
      case 'drag':
        await this.drag(
          step.params.startX || 0,
          step.params.startY || 0,
          step.params.endX || 0,
          step.params.endY || 0,
          {
            button: step.params.button === 'middle' ? 'left' : (step.params.button || 'left') as 'left' | 'right',
            duration: step.params.duration,
            steps: step.params.steps
          }
        );
        break;
      case 'scroll':
        await this.scroll(
          step.params.x || 0,
          step.params.y || 0,
          step.params.deltaX || 0,
          step.params.deltaY || 0
        );
        break;
      case 'type':
        await this.type(step.params.value || '');
        break;
      case 'keyPress':
        await this.keyPress(step.params.key || '');
        break;
      case 'keyCombo':
      case 'hotkey':
        await this.keyCombo(step.params.combo || '');
        break;
      default:
        console.log(`[DesktopRpaManager] 未实现的步骤类型: ${step.action}`);
    }

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
