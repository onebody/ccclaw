<br />
<div align="center">
  <a href="https://github.com/onebody/Ccclaw">
    <img src="src/assets/logo.png" alt="Logo" width="128" height="128">
  </a>

  <h1 align="center" style="margin-top: 0.2em;">Ccclaw</h1>

  [![Electron][electron-badge]][electron-url]
  [![React][react-badge]][react-url]
  [![Vite][vite-badge]][vite-url]
  [![Mantine][mantine-badge]][mantine-url]
  [![Tailwind CSS][tailwind-badge]][tailwind-url]

  <p align="center">
    <h3>不用命令行，小白也能轻松玩转 OpenClaw</h3>
    <br />
    <a href="https://ccclawai.com/"><strong>访问官网 &raquo;</strong></a>
    <br />
    <br />
    <a href="https://github.com/onebody/Ccclaw/blob/main/README.en.md">English</a>
    &middot;
    <a href="https://github.com/onebody/Ccclaw/blob/main/README.md">简体中文</a>
    &middot;
    <a href="https://github.com/onebody/ccclaw/issues/new?labels=bug">报告 Bug</a>
    &middot;
    <a href="https://github.com/onebody/ccclaw/issues/new?labels=enhancement">功能建议</a>
  </p>
</div>

## Star History

<a href="https://www.star-history.com/?repos=onebody%2FCcclaw&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=onebody/Ccclaw&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=onebody/Ccclaw&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=onebody/Ccclaw&type=date&legend=top-left" />
 </picture>
</a>

<details>
  <summary>目录</summary>
  <ol>
    <li><a href="#功能特性">功能特性</a></li>
    <li><a href="#为什么会有这个项目">为什么会有这个项目</a></li>
    <li><a href="#快速上手">快速上手</a></li>
    <li><a href="#快速开发">快速开发</a></li>
    <li><a href="#已知问题">已知问题</a></li>
    <li><a href="#支持环境">支持环境</a></li>
    <li><a href="#贡献指南">贡献指南</a></li>
    <li><a href="#加入社区">加入社区</a></li>
    <li><a href="#加入我们">加入我们</a></li>
    <li><a href="#开源许可">开源许可</a></li>
    <li><a href="#贡献者">贡献者</a></li>
    <li><a href="#致谢">致谢</a></li>
  </ol>
</details>

## 功能特性

<p align="center">
  <img src="docs/images/config.png" alt="可视化配置" width="280">
  <img src="docs/images/im.png" alt="多渠道接入" width="280">
  <img src="docs/images/state_management.png" alt="状态管理" width="280">
</p>
<p align="center">
  <img src="docs/images/safety.png" alt="安全防丢" width="280">
  <img src="docs/images/skills.png" alt="技能扩展" width="280">
</p>

- **环境自检** — 自动检测 Node.js 和 OpenClaw CLI，缺失时自动安装
- **支持 OpenClaw 全量模型** — 支持接入 OpenClaw 的所有模型，也支持自定义添加
- **IM最新插件接入** — 扫码一键接入飞书、微信、企业微信、钉钉、QQ，自动安装官方插件并写入配置
- **应用即教程** — 小白友好的操作引导和提示
- **功能面板** — 实时监控网关状态、一键重启、修复网关
- **Skills管理** — 管理各个来源的skill
- **数据备份** — 提供自动备份和手动备份
- **多平台支持** — 支持 macOS、Windows（开发中），开箱即用
- **自动更新** — 支持OpenClaw最新版本

## 快速上手

### Step 1：下载安装

- 下载并打开 Ccclaw Lite 客户端
  - GitHub Release：[下载最新版本](https://github.com/onebody/Ccclaw/releases)
- 阅读安全提醒内容并确认继续

### Step 2：环境准备

- 运行环境检测
  - 如果系统检测到已有的 OpenClaw 配置，可直接导入
- 按界面提示，准备开始配置

### Step 3：配置模型

- 进入 AI 提供商界面，等待模型列表加载
- 选择你要用的模型（支持 OpenClaw 全量模型，部分模型支持 OAuth 授权）

### Step 4：开始使用

- 在客户端直接发起对话
- 或者前往你刚刚配置的 IM 工具中，测试你的专属 AI 助手

> 💡 关闭 Ccclaw Lite 窗口不会影响后台的 OpenClaw 运行，IM 渠道照常可用。

## 快速开发

### 推荐开发环境

- macOS
- windows
- Ccclaw(OpenClaw)
- [Codex](https://github.com/openai/codex) 或 [Claude Code](https://claude.ai/code)
- Node.js 24（至少22）

### 源码安装

```bash
# 克隆仓库
git clone https://github.com/onebody/Ccclaw.git
cd Ccclaw

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建生产版本
npm run build
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建并打包应用 |
| `npm test` | 运行测试 |
| `npm run typecheck` | TypeScript 类型检查 |

### 项目结构

```
electron/
  main/             主进程（窗口管理、CLI 调用、IPC 处理）
  preload/          预加载脚本（安全桥接）
src/
  pages/            页面组件（向导步骤、Dashboard、聊天等）
  components/       UI 组件
  lib/              业务逻辑（渠道注册、提供商注册等）
  shared/           共享模块（配置流程、网关诊断等）
  assets/           图标与静态资源
docs/               项目相关文档（架构说明、变更日志等）
scripts/            构建与发布脚本（签名公证、版本管理、COS 发布等）
build/              应用图标与打包资源
```

### 技术栈和架构

| 层 | 技术 |
|----|------|
| 桌面框架 | [Electron](https://www.electronjs.org/) |
| 前端 | [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| 构建 | [Vite](https://vitejs.dev/) + vite-plugin-electron |
| UI | [Mantine](https://mantine.dev/) + [Tailwind CSS](https://tailwindcss.com/) |
| 打包 | electron-builder |

```
┌─────────────────────────────────────────────────────────┐
│                           Ccclaw                         │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────────┐  │
│  │   Main Process   │         │  Renderer Process    │  │
│  │   (Node.js)      │   IPC   │  (Chromium)          │  │
│  │                  │◄───────►│                      │  │
│  │  ┌────────────┐  │         │  ┌────────────────┐  │  │
│  │  │  cli.ts    │  │         │  │  React + Vite  │  │  │
│  │  │  OpenClaw  │  │         │  │  Mantine + TW  │  │  │
│  │  │  CLI 调用  │  │         │  │                │  │  │
│  │  └─────┬──────┘  │         │  │  向导页面       │  │  │
│  │        │         │         │  │  Dashboard     │  │  │
│  │  ┌─────▼──────┐  │         │  └────────────────┘  │  │
│  │  │ 系统集成   │  │         │                      │  │
│  │  │ 文件读写   │  │         └──────────────────────┘  │
│  │  │ 进程管理   │  │                                   │
│  │  └────────────┘  │                                   │
│  └──────────────────┘                                   │
│                                                         │
│           │                                             │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │  OpenClaw CLI     │                                  │
│  │  ~/.openclaw/     │                                  │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

## 已知问题

- 这个文档记录了当前项目的已知缺陷和bug（AI有待调教，多多包容）
- 请查看 [Issues](https://github.com/onebody/Ccclaw/issues) 了解具体问题和功能建议。

## 支持环境

- macOS 11 (Big Sur)+
- Windows 10+（x64/arm64/ia32）

## 贡献指南
我们欢迎每一个致力于让前沿 AI Agent 变得更好用、更易用的朋友加入贡献者行列！
无论你是否贡献过代码，只要有想法、有热情，都欢迎加入我们一起交流！🤗



## 开源许可

基于 Apache-2.0 协议分发。详情参见 [`LICENSE`](LICENSE)。·


## 致谢
感谢 OpenClaw——没有它就没有 Ccclaw，我们只是站在巨人肩膀上搭了个小梯子。

感谢 Electron、React、Vite、Mantine 等众多开源项目，以及所有默默贡献的开源作者。Ccclaw 的每一行代码背后，都有你们的影子。

感谢参与内测的朋友们，你们的每一条 bug 反馈和建议都在让产品进步。你们的飞书 ID 我们都记下了 👀

