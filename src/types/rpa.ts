/**
 * RPA 功能类型定义
 *
 * @fileoverview 定义 RPA（机器人流程自动化）功能的类型和接口
 * @author Ccclaw Team
 * @version 1.0
 */

import type { AgentStatus } from './agent';

// ==================== 基础类型 ====================

/** RPA 任务类型 */
export type RpaTaskType = 'web' | 'desktop';

/** RPA 任务状态 */
export type RpaTaskStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/** RPA 步骤操作类型 - 网页 RPA */
export type WebRpaAction =
  | 'navigate'       // 导航到 URL
  | 'click'          // 点击元素
  | 'type'           // 输入文本（原 fill）
  | 'screenshot'     // 截图
  | 'evaluate'       // 执行 JavaScript（原 executeScript）
  | 'wait'           // 等待
  | 'scroll'         // 滚动页面
  | 'hover'          // 悬停
  | 'select'         // 选择下拉框
  | 'upload'         // 上传文件（原 uploadFile）
  | 'press'          // 按键
  | 'check'          // 勾选复选框
  | 'uncheck';       // 取消勾选复选框

/** RPA 步骤操作类型 - 桌面 RPA */
export type DesktopRpaAction =
  | 'captureScreen'   // 捕获屏幕
  | 'recognizeText'   // OCR 识别文字
  | 'findElement'     // 查找元素
  | 'click'           // 鼠标点击
  | 'doubleClick'     // 双击
  | 'rightClick'      // 右键点击
  | 'moveMouse'       // 移动鼠标
  | 'drag'            // 拖拽
  | 'scroll'          // 滚动（鼠标滚轮）
  | 'type'            // 键盘输入
  | 'keyPress'        // 按键
  | 'keyCombo'        // 组合键
  | 'hotkey'          // 快捷键（组合键别名）
  | 'getWindow'       // 获取窗口
  | 'activateWindow'  // 激活窗口
  | 'maximizeWindow'  // 最大化窗口
  | 'minimizeWindow'  // 最小化窗口
  | 'closeWindow'     // 关闭窗口
  | 'screenshot';     // 截图

/** RPA 步骤操作类型（联合类型） */
export type RpaAction = WebRpaAction | DesktopRpaAction;

// ==================== 核心接口 ====================

/** RPA 步骤状态 */
export type RpaStepStatus = 'pending' | 'running' | 'success' | 'error';

/** RPA 步骤定义 */
export interface RpaStep {
  /** 步骤 ID */
  id: string;
  /** 操作类型 */
  action: RpaAction;
  /** 操作参数 */
  params: RpaStepParams;
  /** 步骤描述（可选） */
  description?: string;
  /** 步骤状态（可选） */
  status?: RpaStepStatus;
  /** 执行后的截图（可选） */
  screenshot?: string;
  /** 执行时间戳（可选） */
  executedAt?: string;
  /** 执行结果（可选） */
  result?: 'success' | 'failed';
  /** 错误信息（可选） */
  error?: string;
}

/** RPA 步骤参数 */
export interface RpaStepParams {
  /** 选择器（Web RPA） */
  selector?: string;
  /** URL（Web RPA） */
  url?: string;
  /** 输入值 */
  value?: string;
  /** 按键 */
  key?: string;
  /** 组合键（如 'ctrl+c'） */
  combo?: string;
  /** 坐标 x（Desktop RPA） */
  x?: number;
  /** 坐标 y（Desktop RPA） */
  y?: number;
  /** 拖拽起点 x */
  startX?: number;
  /** 拖拽起点 y */
  startY?: number;
  /** 拖拽终点 x */
  endX?: number;
  /** 拖拽终点 y */
  endY?: number;
  /** 滚动增量 x */
  deltaX?: number;
  /** 滚动增量 y */
  deltaY?: number;
  /** 鼠标按钮（left/right/middle） */
  button?: 'left' | 'right' | 'middle';
  /** 是否双击 */
  double?: boolean;
  /** 拖拽持续时间（毫秒） */
  duration?: number;
  /** 拖拽步数 */
  steps?: number;
  /** 宽度（Desktop RPA） */
  width?: number;
  /** 高度（Desktop RPA） */
  height?: number;
  /** 窗口标题（Desktop RPA） */
  windowTitle?: string;
  /** 进程名（Desktop RPA） */
  processName?: string;
  /** 截图路径 */
  screenshotPath?: string;
  /** 等待超时（毫秒） */
  timeout?: number;
  /** 其他自定义参数 */
  [key: string]: unknown;
}

/** RPA 任务配置 */
export interface RpaTaskConfig {
  /** 浏览器配置（Web RPA） */
  browser?: {
    /** 浏览器类型 */
    type?: 'chromium' | 'firefox' | 'webkit';
    /** 是否无头模式 */
    headless?: boolean;
    /** 视口大小 */
    viewport?: { width: number; height: number };
    /** User-Agent */
    userAgent?: string;
    /** 超时（毫秒） */
    timeout?: number;
    /** 用户数据目录 */
    userDataDir?: string;
    /** 代理服务器 */
    proxy?: string;
  };
  /** OCR 配置（Desktop RPA） */
  ocr?: {
    /** OCR 引擎 */
    engine?: 'tesseract' | 'windows' | 'macos';
    /** 语言 */
    language?: string;
    /** 最小置信度 */
    confidence?: number;
  };
  /** 屏幕捕获配置（Desktop RPA） */
  screenCapture?: {
    /** 图片格式 */
    format?: 'png' | 'jpg' | 'jpeg';
    /** 图片质量（0-100） */
    quality?: number;
    /** 是否包含光标 */
    includeCursor?: boolean;
  };
  /** 输入模拟配置（Desktop RPA） */
  inputSimulation?: {
    /** 鼠标移动速度（像素/秒） */
    mouseSpeed?: number;
    /** 键盘输入延迟（毫秒） */
    keyboardDelay?: number;
    /** 是否启用拖拽 */
    enableDrag?: boolean;
  };
  /** 错误处理策略 */
  errorHandling?: {
    /** 遇到错误时是否继续 */
    continueOnError?: boolean;
    /** 是否截图保存错误现场 */
    screenshotOnError?: boolean;
    /** 最大重试次数 */
    maxRetries?: number;
  };
}

/** RPA 任务定义 */
export interface RpaTask {
  /** 任务 ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: RpaTaskType;
  /** 任务状态 */
  status: RpaTaskStatus;
  /** 任务步骤 */
  steps: RpaStep[];
  /** 任务配置 */
  config?: RpaTaskConfig;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 最后执行时间（可选） */
  lastExecutedAt?: string;
  /** 执行结果（可选） */
  executionResult?: RpaExecutionResult;
}

/** RPA 执行结果 */
export interface RpaExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 执行的步骤数 */
  stepsExecuted: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 执行时长（毫秒） */
  duration: number;
  /** 错误信息（可选） */
  error?: string;
  /** 步骤执行日志 */
  stepLogs: RpaStepLog[];
}

/** RPA 步骤执行日志 */
export interface RpaStepLog {
  /** 步骤 ID */
  stepId: string;
  /** 步骤序号 */
  stepIndex: number;
  /** 是否成功 */
  success: boolean;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 执行时长（毫秒） */
  duration: number;
  /** 错误信息（可选） */
  error?: string;
  /** 截图路径（可选） */
  screenshot?: string;
}

// ==================== 创建/更新输入 ====================

/** 创建 RPA 任务输入 */
export interface RpaTaskCreateInput {
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description?: string;
  /** 任务类型 */
  type: RpaTaskType;
  /** 任务步骤（可选） */
  steps?: Omit<RpaStep, 'id' | 'executedAt' | 'result' | 'error'>[];
  /** 任务配置（可选） */
  config?: RpaTaskConfig;
}

/** 更新 RPA 任务输入 */
export interface RpaTaskUpdateInput {
  /** 任务名称（可选） */
  name?: string;
  /** 任务描述（可选） */
  description?: string;
  /** 任务状态（可选） */
  status?: RpaTaskStatus;
  /** 任务步骤（可选） */
  steps?: Omit<RpaStep, 'id' | 'executedAt' | 'result' | 'error'>[];
  /** 任务配置（可选） */
  config?: RpaTaskConfig;
}

// ==================== 筛选和查询 ====================

/** RPA 任务列表筛选条件 */
export interface RpaTaskListFilter {
  /** 按类型筛选 */
  type?: RpaTaskType;
  /** 按状态筛选 */
  status?: RpaTaskStatus;
  /** 搜索关键词（匹配名称和描述） */
  search?: string;
}

// ==================== 录制相关 ====================

/** RPA 录制配置 */
export interface RpaRecordConfig {
  /** 是否录制鼠标移动 */
  recordMouseMove?: boolean;
  /** 是否录制键盘输入 */
  recordKeyboard?: boolean;
  /** 是否自动截图 */
  autoScreenshot?: boolean;
  /** 截图间隔（毫秒） */
  screenshotInterval?: number;
}

/** RPA 录制状态 */
export interface RpaRecordState {
  /** 是否正在录制 */
  isRecording: boolean;
  /** 录制的任务 ID（可选） */
  taskId?: string;
  /** 已录制的步骤数 */
  stepsRecorded: number;
  /** 开始时间 */
  startTime?: string;
}

// ==================== OCR 相关 ====================

/** OCR 识别结果 */
export interface OcrResult {
  /** 识别的文字 */
  text: string;
  /** 识别的区域 */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 置信度（0-1） */
  confidence: number;
  /** 文字块列表（详细结果） */
  blocks?: OcrTextBlock[];
  /** 识别统计信息 */
  stats?: OcrStats;
}

/** OCR 文字块 */
export interface OcrTextBlock {
  /** 文字内容 */
  text: string;
  /** 边界框 */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 置信度 */
  confidence: number;
  /** 文字行列表 */
  lines?: OcrTextLine[];
}

/** OCR 文字行 */
export interface OcrTextLine {
  /** 文字内容 */
  text: string;
  /** 边界框 */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 置信度 */
  confidence: number;
}

/** OCR 识别选项 */
export interface OcrOptions {
  /** 语言（支持多语言，如 'eng'、'eng+chi_sim'、'chi_sim+eng'） */
  language?: string;
  /** 最小置信度（0-1），低于此值的结果将被过滤 */
  minConfidence?: number;
  /** 是否返回详细结果（包含 blocks、lines 等） */
  detailed?: boolean;
  /** 页面分割模式（PSM）- 影响文字块检测方式 */
  psmMode?: OcrPsmMode;
  /** OEM 引擎模式 */
  oemMode?: OcrOemMode;
  /** 图像预处理选项 */
  preprocessing?: OcrPreprocessingOptions;
  /** 是否启用自动倾斜校正 */
  deskew?: boolean;
}

/** OCR 页面分割模式 */
export type OcrPsmMode =
  | 'auto'          // 0: 完全自动分割
  | 'autoWithOcr'   // 1: 使用 OSD 自动检测方向
  | 'autoOnlyOsd'   // 2: 仅自动检测方向
  | 'normal'        // 3: 完全自动分割，但无 OSD
  | 'singleColumn'  // 4: 假设为单列可变大小文本
  | 'uniformBlock'  // 5: 假设为单个均匀文本块
  | 'singleLine'    // 6: 假设为单行文本
  | 'singleWord'    // 7: 假设为单个单词
  | 'singleChar'    // 8: 假设为单个字符
  | 'sparseText'    // 9: 尽可能密集输出，不考虑顺序
  | 'sparseTextOcr' // 10: 稀疏文本 + OSD
  | 'rawLine';      // 11: 将图像视为单个文本行，绕过 OSD

/** OCR 引擎模式 */
export type OcrOemMode =
  | 'legacy'      // 0: 旧版 Tesseract 引擎
  | 'neuralLstm'  // 1: 神经网络 LSTM（更高精度，推荐）
  | 'legacyPlus'  // 2: 旧版 + LSTM
  | 'default';    // 3: 默认配置

/** OCR 图像预处理选项 */
export interface OcrPreprocessingOptions {
  /** 是否进行灰度转换 */
  grayscale?: boolean;
  /** 是否进行二值化 */
  binarize?: boolean;
  /** 二值化阈值（0-255），默认 128 */
  binarizeThreshold?: number;
  /** 是否进行对比度增强 */
  contrastEnhance?: boolean;
  /** 对比度增强强度（1-10），默认 5 */
  contrastLevel?: number;
  /** 是否进行去噪 */
  denoise?: boolean;
  /** 是否进行图像缩放（用于提高小字体识别） */
  scaleFactor?: number;
  /** 是否进行锐化 */
  sharpen?: boolean;
}

/** OCR 识别统计信息 */
export interface OcrStats {
  /** 识别耗时（毫秒） */
  processingTime: number;
  /** 处理过的图像尺寸 */
  imageSize: { width: number; height: number };
  /** 使用的语言 */
  languages: string;
  /** 引擎版本 */
  tesseractVersion?: string;
}

// ==================== 元素识别相关 ====================

/** 识别到的元素 */
export interface RecognizedElement {
  /** 元素 ID */
  id: string;
  /** 元素类型 */
  type: 'button' | 'input' | 'link' | 'image' | 'text' | 'other';
  /** 元素文本 */
  text?: string;
  /** 元素位置 */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 元素属性 */
  attributes?: Record<string, string>;
  /** 置信度（用于图像识别） */
  confidence?: number;
}

/** 元素识别选项 */
export interface ElementRecognitionOptions {
  /** 识别策略 */
  strategy: 'automation-api' | 'image-matching' | 'ocr' | 'feature-detection';
  /** 搜索条件 */
  query?: {
    /** 按文本搜索 */
    text?: string;
    /** 按类型搜索 */
    type?: string;
    /** 按 ID 搜索 */
    id?: string;
    /** 按类名搜索 */
    className?: string;
  };
  /** 模板图片路径（用于图像匹配） */
  templateImage?: string;
  /** 截图路径（用于图像匹配或 OCR，可选，默认自动捕获屏幕） */
  screenshotPath?: string;
  /** 匹配阈值 0-1（用于图像匹配，默认 0.8） */
  threshold?: number;
}

// ==================== 屏幕捕获相关 ====================

/** 屏幕捕获选项 */
export interface ScreenCaptureOptions {
  /** 捕获类型 */
  type: 'screen' | 'window' | 'region';
  /** 窗口句柄（type = 'window' 时使用） */
  windowHandle?: number;
  /** 捕获区域（type = 'region' 时使用） */
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 输出格式 */
  format?: 'png' | 'jpg' | 'jpeg';
  /** 图片质量（0-100） */
  quality?: number;
  /** 是否包含光标 */
  includeCursor?: boolean;
}

// ==================== 窗口管理相关 ====================

/** 窗口信息 */
export interface WindowInfo {
  /** 窗口句柄 */
  handle: number;
  /** 窗口标题 */
  title: string;
  /** 进程 ID */
  processId: number;
  /** 进程名 */
  processName: string;
  /** 窗口位置 */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 窗口状态 */
  state: 'normal' | 'minimized' | 'maximized' | 'hidden';
  /** 是否可见 */
  visible: boolean;
}

/** 窗口查询选项 */
export interface WindowQueryOptions {
  /** 按标题搜索 */
  title?: string;
  /** 按进程名搜索 */
  processName?: string;
  /** 按进程 ID 搜索 */
  processId?: number;
  /** 只返回可见窗口 */
  onlyVisible?: boolean;
}

// ==================== IPC 接口类型 ====================

/** Web RPA IPC 接口 */
export interface WebRpaIPC {
  /** 创建任务 */
  'rpa:web:createTask': (input: RpaTaskCreateInput) => Promise<RpaTask>;
  /** 获取任务 */
  'rpa:web:getTask': (taskId: string) => Promise<RpaTask | null>;
  /** 获取所有任务 */
  'rpa:web:getAllTasks': (filter?: RpaTaskListFilter) => Promise<RpaTask[]>;
  /** 更新任务 */
  'rpa:web:updateTask': (taskId: string, input: RpaTaskUpdateInput) => Promise<RpaTask | null>;
  /** 删除任务 */
  'rpa:web:deleteTask': (taskId: string) => Promise<boolean>;
  /** 执行任务 */
  'rpa:web:executeTask': (taskId: string) => Promise<RpaExecutionResult>;
  /** 停止任务 */
  'rpa:web:stopTask': (taskId: string) => Promise<boolean>;
  /** 开始录制 */
  'rpa:web:startRecording': (taskId?: string) => Promise<RpaRecordState>;
  /** 停止录制 */
  'rpa:web:stopRecording': () => Promise<RpaTask | null>;
}

/** 桌面 RPA IPC 接口 */
export interface DesktopRpaIPC {
  /** 创建任务 */
  'rpa:desktop:createTask': (input: RpaTaskCreateInput) => Promise<RpaTask>;
  /** 获取任务 */
  'rpa:desktop:getTask': (taskId: string) => Promise<RpaTask | null>;
  /** 获取所有任务 */
  'rpa:desktop:getAllTasks': (filter?: RpaTaskListFilter) => Promise<RpaTask[]>;
  /** 更新任务 */
  'rpa:desktop:updateTask': (taskId: string, input: RpaTaskUpdateInput) => Promise<RpaTask | null>;
  /** 删除任务 */
  'rpa:desktop:deleteTask': (taskId: string) => Promise<boolean>;
  /** 执行任务 */
  'rpa:desktop:executeTask': (taskId: string) => Promise<RpaExecutionResult>;
  /** 停止任务 */
  'rpa:desktop:stopTask': (taskId: string) => Promise<boolean>;
  /** 捕获屏幕 */
  'rpa:desktop:captureScreen': (options: ScreenCaptureOptions) => Promise<string>;
  /** OCR 识别文字 */
  'rpa:desktop:recognizeText': (imagePath: string, options?: OcrOptions) => Promise<OcrResult[]>;
  /** 查找元素 */
  'rpa:desktop:findElement': (options: ElementRecognitionOptions) => Promise<RecognizedElement[]>;
  /** 鼠标点击 */
  'rpa:desktop:click': (x: number, y: number, options?: { button?: 'left' | 'right' | 'middle'; double?: boolean }) => Promise<void>;
  /** 键盘输入 */
  'rpa:desktop:type': (text: string, options?: { delay?: number }) => Promise<void>;
  /** 获取窗口列表 */
  'rpa:desktop:getWindows': (options?: WindowQueryOptions) => Promise<WindowInfo[]>;
}

/** RPA IPC 接口（联合） */
export type RpaIPC = WebRpaIPC & DesktopRpaIPC;
