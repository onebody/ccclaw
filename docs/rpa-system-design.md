# Ccclaw RPA 功能设计与实现方案

**版本**: v1.0  
**日期**: 2026-06-08  
**作者**: Ccclaw Team

---

## 1. 概述

本文档描述 Ccclaw 项目中 RPA（机器人流程自动化）功能的完整设计与实现方案，包括：

1. **网页 RPA**：基于 Playwright 的浏览器自动化
2. **桌面 RPA**：基于屏幕捕获 + OCR + 元素识别的桌面自动化

---

## 2. 技术选型

### 2.1 网页 RPA

**核心技术：Playwright**

**选择理由**：
- ✅ 支持 Chromium、Firefox、WebKit 多浏览器
- ✅ 支持 Electron 应用自动化（实验性支持）
- ✅ 强大的元素定位能力（CSS、XPath、文本内容等）
- ✅ 支持录制和代码生成
- ✅ 跨平台（Windows、macOS、Linux）
- ✅ 已有 Playwright skill 可直接使用

**功能范围**：
- 浏览器页面自动化（点击、输入、导航等）
- Electron 应用自动化
- 网页元素识别与操作
- 表单自动填充
- 数据抓取

### 2.2 桌面 RPA

**核心技术栈**：
1. **屏幕捕获**：Electron `desktopCapturer` API
2. **图像识别**：OpenCV.js / TensorFlow.js
3. **OCR 文字识别**：
   - Tesseract.js（跨平台，纯 JavaScript）
   - Windows：Windows AI OCR API（on-device）
   - macOS：Vision Framework（通过 Node.js addon）
4. **窗口元素识别**：
   - Windows：UI Automation API（通过 `node-win32-api`）
   - macOS：Accessibility API（通过 `node-mac-accessibility`）
   - Linux：AT-SPI（通过 `node-at-spi`）

**功能范围**：
- 屏幕截图与图像匹配
- 窗口元素定位与操作
- OCR 文字识别与提取
- 鼠标键盘模拟
- 窗口控制（最大化、最小化、关闭等）

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Ccclaw 应用层                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Web RPA     │  │  Desktop RPA │  │  RPA Editor  │  │
│  │  UI Page     │  │  UI Page     │  │  (流程编辑器) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  RPA Engine (Main Process)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Playwright   │  │ Screen       │  │ OCR Engine   │  │
│  │ Automation   │  │ Capture      │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Element      │  │ Input        │  │ Window       │  │
│  │ Recognition  │  │ Simulation   │  │ Manager      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              System APIs (Native Modules)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Windows UI   │  │ macOS        │  │ Linux AT-SPI │  │
│  │ Automation   │  │ Accessibility │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 模块划分

#### 3.2.1 Web RPA 模块

**文件结构**：
```
electron/main/rpa/
├── web-rpa-manager.ts          # Web RPA 管理器
├── playwright-engine.ts         # Playwright 引擎封装
├── rpa-recorder.ts             # RPA 录制器
├── rpa-player.ts               # RPA 播放器
└── __tests__/
    ├── web-rpa-manager.test.ts
    └── playwright-engine.test.ts
```

**核心类**：
- `WebRpaManager`：Web RPA 业务逻辑管理
- `PlaywrightEngine`：Playwright 引擎封装
- `RpaRecorder`：操作录制
- `RpaPlayer`：流程回放

#### 3.2.2 桌面 RPA 模块

**文件结构**：
```
electron/main/rpa/
├── desktop-rpa-manager.ts      # 桌面 RPA 管理器
├── screen-capture.ts           # 屏幕捕获
├── ocr-engine.ts               # OCR 引擎
├── element-recognizer.ts       # 元素识别器
├── input-simulator.ts          # 输入模拟（鼠标、键盘）
├── window-manager.ts           # 窗口管理器
└── __tests__/
    ├── desktop-rpa-manager.test.ts
    └── ocr-engine.test.ts
```

**核心类**：
- `DesktopRpaManager`：桌面 RPA 业务逻辑管理
- `ScreenCapture`：屏幕捕获
- `OcrEngine`：OCR 文字识别
- `ElementRecognizer`：元素识别
- `InputSimulator`：鼠标键盘模拟
- `WindowManager`：窗口管理

#### 3.2.3 RPA 流程编辑器

**文件结构**：
```
frontend/src/
├── pages/
│   └── RpaEditor.tsx           # RPA 流程编辑器页面
├── components/
│   └── rpa/
│       ├── RpaWorkflowEditor.tsx   # 流程编辑器
│       ├── RpaActionList.tsx       # 操作列表
│       ├── RpaRecorder.tsx         # 录制器 UI
│       └── RpaPlayer.tsx           # 播放器 UI
└── hooks/
    └── useRpa.ts              # RPA Hooks
```

---

## 4. 功能详细设计

### 4.1 网页 RPA 功能

#### 4.1.1 浏览器自动化

**支持的操作**：
- ✅ 页面导航（打开 URL、前进、后退、刷新）
- ✅ 元素操作（点击、输入、选择、悬停）
- ✅ 表单填充
- ✅ 文件上传
- ✅ 截图
- ✅ 执行 JavaScript
- ✅ 处理弹窗（alert、confirm、prompt）
- ✅ 处理新窗口/标签页
- ✅ 网络拦截与 mock

**示例代码**：
```typescript
// 创建 Web RPA 任务
const task = webRpaManager.createTask({
  name: '自动登录示例',
  steps: [
    { action: 'navigate', url: 'https://example.com/login' },
    { action: 'fill', selector: '#username', value: 'user' },
    { action: 'fill', selector: '#password', value: 'pass' },
    { action: 'click', selector: '#login-button' },
    { action: 'wait', selector: '.dashboard' },
    { action: 'screenshot', path: 'screenshot.png' }
  ]
});

// 执行任务
await webRpaManager.executeTask(task.id);
```

#### 4.1.2 Electron 应用自动化

**支持的操作**：
- ✅ 启动 Electron 应用
- ✅ 获取窗口列表
- ✅ 操作窗口内的 Web 元素
- ✅ 执行主进程代码
- ✅ 访问 Electron API

**示例代码**：
```typescript
// 自动化 Electron 应用
const electronApp = await playwrightEngine.launchElectron({
  executablePath: '/path/to/electron/app',
  args: ['--remote-debugging-port=9222']
});

const window = electronApp.windows()[0];
await window.click('#button');
```

#### 4.1.3 RPA 录制

**功能**：
- ✅ 记录用户在浏览器中的操作
- ✅ 自动生成 Playwright 代码
- ✅ 支持暂停/继续录制
- ✅ 支持编辑录制的步骤

**实现方式**：
- 使用 Playwright 的 `record` 模式
- 监听浏览器事件（click、input、navigation 等）
- 生成结构化的步骤数据

### 4.2 桌面 RPA 功能

#### 4.2.1 屏幕捕获

**功能**：
- ✅ 捕获整个屏幕
- ✅ 捕获指定窗口
- ✅ 捕获指定区域
- ✅ 定时截图（用于监控）
- ✅ 视频录制（可选）

**实现方式**：
```typescript
// 使用 Electron desktopCapturer
import { desktopCapturer } from 'electron';

const sources = await desktopCapturer.getSources({
  types: ['screen', 'window']
});

// 捕获屏幕
const screenImage = await screenCapture.captureScreen();
```

#### 4.2.2 OCR 文字识别

**功能**：
- ✅ 识别屏幕上的文字
- ✅ 识别指定区域的文字
- ✅ 支持多语言（中文、英文等）
- ✅ 返回文字位置和置信度

**实现方式**：

**方案 A：Tesseract.js（推荐，跨平台）**
```typescript
import Tesseract from 'tesseract.js';

const result = await Tesseract.recognize(
  imagePath,
  'chi_sim+eng' // 中文简体 + 英文
);

console.log(result.data.text);
```

**方案 B：Windows AI OCR（Windows 专用，性能更好）**
```typescript
// 使用 Windows Runtime OCR API
// 需要编写 Node.js addon
```

**方案 C：macOS Vision Framework（macOS 专用）**
```typescript
// 使用 @image/ml 或编写 Node.js addon
```

#### 4.2.3 元素识别

**功能**：
- ✅ 识别窗口中的可交互元素（按钮、输入框、链接等）
- ✅ 获取元素的位置和大小
- ✅ 获取元素的属性（文本、ID、类名等）
- ✅ 支持图像匹配（找到屏幕上的图片）

**实现方式**：

**方案 A：基于系统 API（推荐）**

Windows：
```typescript
import { UIAutomation } from 'node-win32-api';

const elements = await UIAutomation.getElements(windowHandle);
const button = elements.find(el => el.name === '确定');
await button.click();
```

macOS：
```typescript
import { Accessibility } from 'node-mac-accessibility';

const elements = await Accessibility.getElements(appName);
const button = elements.find(el => el.title === '确定');
await button.performAction('AXPress');
```

**方案 B：基于图像识别（通用方案）**

使用 OpenCV.js 进行模板匹配：
```typescript
import cv from 'opencv.js';

// 加载模板图片
const template = cv.imread('button-template.png');

// 在屏幕截图中查找模板
const result = cv.matchTemplate(screenImage, template, cv.TM_CCOEFF_NORMED);

// 找到匹配位置
const location = cv.minMaxLoc(result);
```

#### 4.2.4 输入模拟

**功能**：
- ✅ 鼠标操作（移动、点击、双击、右键、拖拽）
- ✅ 键盘操作（按键、组合键、输入文字）
- ✅ 支持相对位置和绝对位置

**实现方式**：

**跨平台方案：RobotJS**
```typescript
import robot from 'robotjs';

// 鼠标点击
robot.moveMouse(100, 200);
robot.mouseClick();

// 键盘输入
robot.typeString('Hello World');
robot.keyTap('enter');
```

**平台特定方案**：
- Windows：使用 `SendInput` API
- macOS：使用 `Core Graphics Event` API
- Linux：使用 `X11` 或 `Wayland` API

#### 4.2.5 窗口管理

**功能**：
- ✅ 获取窗口列表
- ✅ 获取窗口信息（标题、位置、大小、状态）
- ✅ 窗口操作（最大化、最小化、还原、关闭、置顶）
- ✅ 查找窗口（按标题、进程名等）

**实现方式**：

Windows：
```typescript
import { user32 } from 'node-win32-api';

const windows = user32.EnumWindows();
const notepad = windows.find(w => w.title.includes('记事本'));
user32.ShowWindow(notepad.handle, 3); // SW_MAXIMIZE
```

macOS：
```typescript
import { Accessibility } from 'node-mac-accessibility';

const apps = Accessibility.getRunningApps();
const notepad = apps.find(app => app.name === '记事本');
await notepad.activate();
```

---

## 5. 数据流设计

### 5.1 RPA 任务定义

```typescript
interface RpaTask {
  id: string;
  name: string;
  type: 'web' | 'desktop';
  steps: RpaStep[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface RpaStep {
  id: string;
  action: string;
  params: Record<string, unknown>;
  screenshot?: string; // 可选：步骤执行后的截图
}
```

### 5.2 RPA 执行流程

```
┌─────────────┐
│  用户创建   │
│  RPA 任务   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  验证任务   │
│  合法性     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  初始化     │
│  RPA 引擎   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  循环执行   │
│  每个步骤   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  执行步骤   │
│  - Web:     │
│    Playwright│
│  - Desktop: │
│    屏幕捕获  │
│    OCR      │
│    元素识别  │
│    输入模拟  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  记录执行   │
│  日志和     │
│  截图       │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  任务完成   │
│  或出错     │
└─────────────┘
```

---

## 6. IPC 接口设计

### 6.1 Web RPA IPC 接口

| IPC Channel | 功能 | 参数 |
|-------------|------|------|
| `rpa:web:createTask` | 创建 Web RPA 任务 | `RpaTaskCreateInput` |
| `rpa:web:getTask` | 获取任务详情 | `taskId` |
| `rpa:web:getAllTasks` | 获取所有任务 | `filter?` |
| `rpa:web:updateTask` | 更新任务 | `taskId, input` |
| `rpa:web:deleteTask` | 删除任务 | `taskId` |
| `rpa:web:executeTask` | 执行任务 | `taskId` |
| `rpa:web:stopTask` | 停止任务 | `taskId` |
| `rpa:web:record` | 开始录制 | `taskId?` |
| `rpa:web:stopRecording` | 停止录制 | - |

### 6.2 桌面 RPA IPC 接口

| IPC Channel | 功能 | 参数 |
|-------------|------|------|
| `rpa:desktop:createTask` | 创建桌面 RPA 任务 | `RpaTaskCreateInput` |
| `rpa:desktop:getTask` | 获取任务详情 | `taskId` |
| `rpa:desktop:getAllTasks` | 获取所有任务 | `filter?` |
| `rpa:desktop:updateTask` | 更新任务 | `taskId, input` |
| `rpa:desktop:deleteTask` | 删除任务 | `taskId` |
| `rpa:desktop:executeTask` | 执行任务 | `taskId` |
| `rpa:desktop:stopTask` | 停止任务 | `taskId` |
| `rpa:desktop:captureScreen` | 捕获屏幕 | `options?` |
| `rpa:desktop:recognizeText` | OCR 识别文字 | `imagePath, options?` |
| `rpa:desktop:findElement` | 查找元素 | `options` |
| `rpa:desktop:click` | 鼠标点击 | `x, y, options?` |
| `rpa:desktop:type` | 键盘输入 | `text, options?` |
| `rpa:desktop:getWindows` | 获取窗口列表 | `options?` |

---

## 7. UI 设计

### 7.1 RPA 流程编辑器页面

**布局**：
```
┌─────────────────────────────────────────────────────────┐
│  工具栏（新建、保存、录制、播放、停止）                  │
└─────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────┐
│  任务列表         │  流程编辑器                          │
│  - 任务 1        │  ┌────────┐  ┌────────┐            │
│  - 任务 2        │  │步骤 1  │  │步骤 2  │            │
│  - 任务 3        │  └────────┘  └────────┘            │
│                  │      ↓          ↓                  │
│                  │  ┌────────┐  ┌────────┐            │
│                  │  │步骤 3  │  │步骤 4  │            │
│                  │  └────────┘  └────────┘            │
└──────────────────┴──────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  日志面板（执行日志、错误信息）                          │
└─────────────────────────────────────────────────────────┘
```

### 7.2 录制器 UI

**功能**：
- ✅ 显示当前录制的步骤
- ✅ 实时预览（截图）
- ✅ 暂停/继续按钮
- ✅ 保存录制按钮

### 7.3 播放器 UI

**功能**：
- ✅ 显示执行进度
- ✅ 当前步骤高亮
- ✅ 执行日志实时显示
- ✅ 暂停/继续/停止按钮
- ✅ 截图回放

---

## 8. 实现计划

### 8.1 Phase 1: 基础框架（1-2 周）

**任务**：
- [ ] 创建 RPA 模块文件结构
- [ ] 实现 `WebRpaManager` 和 `DesktopRpaManager`
- [ ] 实现基础的 IPC 接口
- [ ] 创建 RPA 类型定义

**交付物**：
- 类型定义文件
- 管理器类
- IPC 桥接层

### 8.2 Phase 2: 网页 RPA（2-3 周）

**任务**：
- [ ] 集成 Playwright
- [ ] 实现 `PlaywrightEngine`
- [ ] 实现 `RpaRecorder`
- [ ] 实现 `RpaPlayer`
- [ ] 编写单元测试

**交付物**：
- Playwright 引擎封装
- 录制和播放功能
- 测试覆盖

### 8.3 Phase 3: 桌面 RPA - 屏幕捕获和 OCR（2-3 周）

**任务**：
- [ ] 实现 `ScreenCapture`
- [ ] 集成 Tesseract.js
- [ ] 实现 `OcrEngine`
- [ ] 实现 `InputSimulator`（使用 RobotJS）
- [ ] 编写单元测试

**交付物**：
- 屏幕捕获功能
- OCR 文字识别功能
- 鼠标键盘模拟功能

### 8.4 Phase 4: 桌面 RPA - 元素识别（3-4 周）

**任务**：
- [ ] 研究并选择合适的元素识别方案
- [ ] 实现 Windows UI Automation 支持
- [ ] 实现 macOS Accessibility API 支持
- [ ] 实现图像识别（OpenCV.js）
- [ ] 编写单元测试

**交付物**：
- 窗口元素识别功能
- 图像匹配功能

### 8.5 Phase 5: UI 实现（2-3 周）

**任务**：
- [ ] 创建 RPA 流程编辑器页面
- [ ] 实现 `RpaWorkflowEditor` 组件
- [ ] 实现 `RpaActionList` 组件
- [ ] 实现 `RpaRecorder` 组件
- [ ] 实现 `RpaPlayer` 组件
- [ ] 创建 `useRpa` Hook

**交付物**：
- 完整的 RPA UI
- 流程编辑、录制、播放功能

### 8.6 Phase 6: 测试和优化（1-2 周）

**任务**：
- [ ] E2E 测试
- [ ] 性能优化
- [ ] 文档编写
- [ ] 用户手册

**交付物**：
- 测试报告
- 性能报告
- 用户文档

---

## 9. 风险和挑战

### 9.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Playwright Electron 支持不稳定 | 高 | 使用稳定版本，提供降级方案 |
| OCR 识别准确率不高 | 中 | 提供多种 OCR 引擎选择，支持训练 |
| 元素识别跨平台兼容性 | 高 | 提供多种识别方案，优先使用系统 API |
| 性能问题（屏幕捕获、图像处理） | 中 | 使用 Web Worker 离线处理，优化算法 |

### 9.2 非技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 开发周期长 | 高 | 分阶段交付，优先实现核心功能 |
| 用户体验不佳 | 中 | 早期用户测试，快速迭代 |
| 文档不足 | 低 | 同步编写文档，提供示例代码 |

---

## 10. 依赖项

### 10.1 npm 包

**网页 RPA**：
- `playwright`: ^1.49.0
- `playwright-core`: ^1.49.0

**桌面 RPA**：
- `tesseract.js`: ^5.1.1（OCR）
- `robotjs`: ^0.6.0（输入模拟）
- `@nut-tree-fork/nut-js`: ^3.0.0（图像识别与输入模拟，跨平台）
- `opencv.js`: 使用 CDN 或本地文件

**平台特定（可选）**：
- `node-win32-api`: ^0.7.0（Windows UI Automation）
- `node-mac-accessibility`: （需要自己编写或找开源项目）
- `electron-screenshot`: ^0.1.0（屏幕捕获）

### 10.2 系统依赖

**Windows**：
- Visual C++ Build Tools（用于编译 native modules）
- Windows SDK（用于 UI Automation）

**macOS**：
- Xcode Command Line Tools（用于编译 native modules）
- Accessibility 权限

**Linux**：
- libX11-dev
- libxtst-dev
- build-essential

---

## 11. 参考资料

1. [Playwright 官方文档](https://playwright.dev/)
2. [Playwright Electron 支持](https://playwright.dev/docs/api/class-electron)
3. [Tesseract.js 文档](https://tesseract.projectnaptha.com/)
4. [RobotJS 文档](https://robotjs.io/)
5. [Electron desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer)
6. [Windows UI Automation](https://learn.microsoft.com/en-us/windows/win32/uiacore/ui-automation-fundamentals)
7. [macOS Accessibility API](https://developer.apple.com/documentation/accessibility)

---

## 12. 附录

### 12.1 RPA 步骤类型定义

```typescript
// 网页 RPA 步骤类型
type WebRpaAction =
  | 'navigate'        // 导航到 URL
  | 'click'           // 点击元素
  | 'fill'            // 填充输入框
  | 'select'          // 选择下拉框
  | 'hover'           // 悬停
  | 'press'           // 按键
  | 'screenshot'      // 截图
  | 'wait'            // 等待元素
  | 'executeScript'   // 执行 JavaScript
  | 'uploadFile'      // 上传文件
  | 'handleDialog'    // 处理弹窗
  | 'switchWindow'    // 切换窗口
  | 'switchFrame';    // 切换 iframe

// 桌面 RPA 步骤类型
type DesktopRpaAction =
  | 'captureScreen'    // 捕获屏幕
  | 'recognizeText'    // OCR 识别文字
  | 'findElement'      // 查找元素
  | 'click'            // 鼠标点击
  | 'doubleClick'      // 双击
  | 'rightClick'       // 右键点击
  | 'moveMouse'        // 移动鼠标
  | 'drag'             // 拖拽
  | 'type'             // 键盘输入
  | 'keyPress'         // 按键
  | 'keyCombo'         // 组合键
  | 'getWindow'        // 获取窗口
  | 'activateWindow'   // 激活窗口
  | 'maximizeWindow'   // 最大化窗口
  | 'minimizeWindow'   // 最小化窗口
  | 'closeWindow'      // 关闭窗口
  | 'screenshot';      // 截图
```

### 12.2 配置文件示例

```json
// rpa-config.json
{
  "webRpa": {
    "browser": "chromium",
    "headless": false,
    "timeout": 30000,
    "screenshotOnError": true
  },
  "desktopRpa": {
    "ocr": {
      "engine": "tesseract",
      "language": "chi_sim+eng",
      "confidence": 0.8
    },
    "screenCapture": {
      "format": "png",
      "quality": 90
    },
    "inputSimulation": {
      "mouseSpeed": 100,
      "keyboardDelay": 50
    }
  }
}
```

---

**文档结束**

_本文档将随着开发进展持续更新。_
