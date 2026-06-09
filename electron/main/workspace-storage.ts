/**
 * Workspace 数据存储模块
 *
 * @fileoverview 提供 Workspace、Task、ChatSession 的持久化存储功能
 * @author Ccclaw Team
 */

import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'node:crypto'
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskListFilter,
  ChatSession,
  ChatMessage,
  Artifact,
} from '../../src/types/workspace'

// ============================================================================
// 工具函数
// ============================================================================

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const tempPath = filePath + '.tmp'
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tempPath, filePath)
}

function nowISO(): string {
  return new Date().toISOString()
}

// ============================================================================
// WorkspaceStorage
// ============================================================================

export class WorkspaceStorage {
  private workspacesPath: string
  private tasksPath: string
  private chatsDir: string
  private artifactsDir: string

  constructor(userDataPath: string) {
    this.workspacesPath = path.join(userDataPath, 'workspaces.json')
    this.tasksPath = path.join(userDataPath, 'tasks.json')
    this.chatsDir = path.join(userDataPath, 'chats')
    this.artifactsDir = path.join(userDataPath, 'artifacts')
    this.ensureDirs()
  }

  private ensureDirs(): void {
    for (const dir of [this.chatsDir, this.artifactsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  // ---- Workspace ----

  private loadWorkspaces(): Workspace[] {
    return readJsonFile<Workspace[]>(this.workspacesPath) ?? []
  }

  private saveWorkspaces(workspaces: Workspace[]): void {
    writeJsonFile(this.workspacesPath, workspaces)
  }

  listWorkspaces(): Workspace[] {
    return this.loadWorkspaces().sort((a, b) => a.order - b.order)
  }

  getWorkspace(id: string): Workspace | null {
    return this.loadWorkspaces().find(w => w.id === id) ?? null
  }

  createWorkspace(input: WorkspaceCreateInput): Workspace {
    const workspaces = this.loadWorkspaces()
    const activeWorkspace = workspaces.find(w => w.isActive)

    const workspace: Workspace = {
      id: randomUUID(),
      name: input.name,
      rootPath: input.rootPath,
      description: input.description,
      color: input.color ?? 'blue',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      isActive: false, // 新建不自动激活
      order: workspaces.length,
    }

    workspaces.push(workspace)
    this.saveWorkspaces(workspaces)
    return workspace
  }

  updateWorkspace(id: string, input: WorkspaceUpdateInput): Workspace | null {
    const workspaces = this.loadWorkspaces()
    const idx = workspaces.findIndex(w => w.id === id)
    if (idx === -1) return null

    const updated: Workspace = {
      ...workspaces[idx],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.rootPath !== undefined && { rootPath: input.rootPath }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.order !== undefined && { order: input.order }),
      updatedAt: nowISO(),
    }

    workspaces[idx] = updated
    this.saveWorkspaces(workspaces)
    return updated
  }

  deleteWorkspace(id: string): boolean {
    const workspaces = this.loadWorkspaces()
    const filtered = workspaces.filter(w => w.id !== id)
    if (filtered.length === workspaces.length) return false

    // 级联删除其下所有任务
    const tasks = this.loadTasks().filter(t => t.workspaceId !== id)
    this.saveTasks(tasks)

    this.saveWorkspaces(filtered)
    return true
  }

  activateWorkspace(id: string): Workspace | null {
    const workspaces = this.loadWorkspaces()
    for (const w of workspaces) {
      w.isActive = w.id === id
      w.updatedAt = nowISO()
    }
    this.saveWorkspaces(workspaces)
    return workspaces.find(w => w.id === id) ?? null
  }

  getActiveWorkspace(): Workspace | null {
    return this.loadWorkspaces().find(w => w.isActive) ?? null
  }

  validatePath(p: string): { valid: boolean; error?: string } {
    try {
      const stat = fs.statSync(p)
      if (!stat.isDirectory()) return { valid: false, error: '路径不是一个目录' }
      fs.accessSync(p, fs.constants.R_OK | fs.constants.W_OK)
      return { valid: true }
    } catch (e) {
      return { valid: false, error: `路径不存在或无法访问: ${p}` }
    }
  }

  // ---- Task ----

  private loadTasks(): Task[] {
    return readJsonFile<Task[]>(this.tasksPath) ?? []
  }

  private saveTasks(tasks: Task[]): void {
    writeJsonFile(this.tasksPath, tasks)
  }

  listTasks(filter?: TaskListFilter): Task[] {
    let tasks = this.loadTasks()
    if (filter?.workspaceId) {
      tasks = tasks.filter(t => t.workspaceId === filter.workspaceId)
    }
    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status]
      tasks = tasks.filter(t => statuses.includes(t.status))
    }
    if (filter?.priority) {
      tasks = tasks.filter(t => t.priority === filter.priority)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q))
    }
    if (filter?.from) {
      tasks = tasks.filter(t => t.createdAt >= filter.from!)
    }
    if (filter?.to) {
      tasks = tasks.filter(t => t.createdAt <= filter.to!)
    }
    return tasks.sort((a, b) => a.order - b.order)
  }

  listTasksByWorkspace(workspaceId: string): Task[] {
    return this.listTasks({ workspaceId })
  }

  getTask(id: string): Task | null {
    return this.loadTasks().find(t => t.id === id) ?? null
  }

  createTask(input: TaskCreateInput): Task {
    const tasks = this.loadTasks()
    const existingInWorkspace = tasks.filter(t => t.workspaceId === input.workspaceId)

    const task: Task = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      title: input.title,
      description: input.description,
      status: 'pending',
      priority: input.priority ?? 'normal',
      chatSessionIds: [],
      agentId: input.agentId,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      createdBy: 'user',
      order: existingInWorkspace.length,
    }

    // 自动创建第一个 ChatSession
    const session = this.createSession(task.id, input.title)
    task.chatSessionIds = [session.id]

    tasks.push(task)
    this.saveTasks(tasks)
    return task
  }

  updateTask(id: string, input: TaskUpdateInput): Task | null {
    const tasks = this.loadTasks()
    const idx = tasks.findIndex(t => t.id === id)
    if (idx === -1) return null

    const task = tasks[idx]
    const prevStatus = task.status

    if (input.status !== undefined) task.status = input.status
    if (input.title !== undefined) task.title = input.title
    if (input.description !== undefined) task.description = input.description
    if (input.priority !== undefined) task.priority = input.priority
    if (input.chatSessionIds !== undefined) task.chatSessionIds = input.chatSessionIds
    if (input.agentId !== undefined) task.agentId = input.agentId
    if (input.notes !== undefined) task.notes = input.notes
    if (input.order !== undefined) task.order = input.order

    task.updatedAt = nowISO()

    // 状态变更时记录时间戳
    if (input.status === 'running' && prevStatus === 'pending') {
      task.startedAt = nowISO()
    }
    if (
      (input.status === 'completed' || input.status === 'failed' || input.status === 'cancelled')
      && prevStatus !== 'completed' && prevStatus !== 'failed' && prevStatus !== 'cancelled'
    ) {
      task.finishedAt = nowISO()
      if (task.startedAt) {
        task.durationMs = new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime()
      }
    }

    tasks[idx] = task
    this.saveTasks(tasks)
    return task
  }

  deleteTask(id: string): boolean {
    const tasks = this.loadTasks()
    const task = tasks.find(t => t.id === id)
    if (!task) return false

    // 级联删除会话和制品
    for (const sessionId of task.chatSessionIds) {
      this.deleteSession(sessionId)
    }

    const filtered = tasks.filter(t => t.id !== id)
    this.saveTasks(filtered)
    return true
  }

  // ---- ChatSession ----

  private getSessionPath(sessionId: string): string {
    return path.join(this.chatsDir, `${sessionId}.json`)
  }

  private loadSession(sessionId: string): ChatSession | null {
    return readJsonFile<ChatSession>(this.getSessionPath(sessionId))
  }

  private saveSession(session: ChatSession): void {
    writeJsonFile(this.getSessionPath(session.id), session)
  }

  createSession(taskId: string, title?: string): ChatSession {
    const session: ChatSession = {
      id: randomUUID(),
      taskId,
      title: title ?? '新建会话',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      messageCount: 0,
    }
    this.saveSession(session)
    return session
  }

  listSessionsByTask(taskId: string): ChatSession[] {
    const sessionIds = this.loadTasks()
      .find(t => t.id === taskId)?.chatSessionIds ?? []

    const sessions: ChatSession[] = []
    for (const id of sessionIds) {
      const s = this.loadSession(id)
      if (s) sessions.push(s)
    }
    return sessions.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getSession(id: string): ChatSession | null {
    return this.loadSession(id)
  }

  deleteSession(id: string): void {
    const sessionPath = this.getSessionPath(id)
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath)
    }
  }

  updateSession(id: string, input: Partial<ChatSession>): ChatSession | null {
    const sessionPath = this.getSessionPath(id)
    const session = readJsonFile<ChatSession>(sessionPath)
    if (!session) return null

    if (input.title !== undefined) session.title = input.title
    if (input.chatSessionId !== undefined) session.chatSessionId = input.chatSessionId
    session.updatedAt = nowISO()

    writeJsonFile(sessionPath, session)
    return session
  }

  // ---- ChatMessage ----

  listMessagesBySession(sessionId: string): ChatMessage[] {
    const session = this.loadSession(sessionId)
    if (!session) return []
    // 消息数据存储在 session 内（内嵌方式避免过多小文件）
    return (session as unknown as { messages?: ChatMessage[] }).messages ?? []
  }

  addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'createdAt' | 'sessionId'>): ChatMessage {
    const session = this.loadSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const msg: ChatMessage = {
      ...message,
      id: randomUUID(),
      sessionId,
      createdAt: nowISO(),
    }

    ;(session as unknown as { messages: ChatMessage[] }).messages ??= []
    ;(session as unknown as { messages: ChatMessage[] }).messages.push(msg)
    session.messageCount = (session as unknown as { messages: ChatMessage[] }).messages.length
    session.updatedAt = nowISO()

    this.saveSession(session)
    return msg
  }

  // ---- Artifact ----

  listArtifactsByTask(taskId: string): Artifact[] {
    const artifacts = readJsonFile<Artifact[]>(path.join(this.artifactsDir, 'index.json')) ?? []
    return artifacts.filter(a => a.taskId === taskId)
  }

  addArtifact(artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact {
    const all: Artifact[] = readJsonFile<Artifact[]>(path.join(this.artifactsDir, 'index.json')) ?? []

    const a: Artifact = {
      ...artifact,
      id: randomUUID(),
      createdAt: nowISO(),
    }

    all.push(a)
    writeJsonFile(path.join(this.artifactsDir, 'index.json'), all)
    return a
  }

  deleteArtifact(id: string): void {
    const all: Artifact[] = readJsonFile<Artifact[]>(path.join(this.artifactsDir, 'index.json')) ?? []
    writeJsonFile(
      path.join(this.artifactsDir, 'index.json'),
      all.filter(a => a.id !== id)
    )
  }

  getArtifact(id: string): Artifact | null {
    const all: Artifact[] = readJsonFile<Artifact[]>(path.join(this.artifactsDir, 'index.json')) ?? []
    return all.find(a => a.id === id) ?? null
  }

  updateArtifact(id: string, input: Partial<Artifact>): Artifact | null {
    const all: Artifact[] = readJsonFile<Artifact[]>(path.join(this.artifactsDir, 'index.json')) ?? []
    const idx = all.findIndex(a => a.id === id)
    if (idx === -1) return null

    const updated: Artifact = {
      ...all[idx],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.path !== undefined && { path: input.path }),
      ...(input.size !== undefined && { size: input.size }),
      ...(input.gitChangeType !== undefined && { gitChangeType: input.gitChangeType }),
      ...(input.isNew !== undefined && { isNew: input.isNew }),
      createdAt: all[idx].createdAt, // 保持不变
    }

    all[idx] = updated
    writeJsonFile(path.join(this.artifactsDir, 'index.json'), all)
    return updated
  }
}
