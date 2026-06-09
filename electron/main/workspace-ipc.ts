/**
 * Workspace IPC 通道
 *
 * @fileoverview 注册 workspace/task/session/artifact 相关的 IPC handle
 * @author Ccclaw Team
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'node:path'
import { WorkspaceStorage } from './workspace-storage'
import simpleGit, { SimpleGit } from 'simple-git'
import type {
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
  TaskListFilter,
  ChatSession,
  Artifact,
} from '../../src/types/workspace'

let storage: WorkspaceStorage | null = null

function getStorage(): WorkspaceStorage {
  if (!storage) {
    throw new Error('WorkspaceStorage has not been initialized. Call initWorkspaceIPC first.')
  }
  return storage
}

export function initWorkspaceIPC(userDataPath: string): void {
  storage = new WorkspaceStorage(userDataPath)

  // ===================== Workspace =====================

  ipcMain.handle('workspace:list', async () => {
    return getStorage().listWorkspaces()
  })

  ipcMain.handle('workspace:get', async (_, id: string) => {
    return getStorage().getWorkspace(id)
  })

  ipcMain.handle('workspace:create', async (_, input: WorkspaceCreateInput) => {
    return getStorage().createWorkspace(input)
  })

  ipcMain.handle('workspace:update', async (_, id: string, input: WorkspaceUpdateInput) => {
    return getStorage().updateWorkspace(id, input)
  })

  ipcMain.handle('workspace:delete', async (_, id: string) => {
    getStorage().deleteWorkspace(id)
    return true
  })

  ipcMain.handle('workspace:activate', async (_, id: string) => {
    return getStorage().activateWorkspace(id)
  })

  ipcMain.handle('workspace:getActive', async () => {
    return getStorage().getActiveWorkspace()
  })

  ipcMain.handle('workspace:validate', async (_, p: string) => {
    return getStorage().validatePath(p)
  })

  ipcMain.handle('workspace:openDialog', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: '选择工作空间目录',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // ===================== Task =====================

  ipcMain.handle('task:list', async (_, filter?: TaskListFilter) => {
    return getStorage().listTasks(filter)
  })

  ipcMain.handle('task:get', async (_, id: string) => {
    return getStorage().getTask(id)
  })

  ipcMain.handle('task:create', async (_, input: TaskCreateInput) => {
    return getStorage().createTask(input)
  })

  ipcMain.handle('task:update', async (_, id: string, input: TaskUpdateInput) => {
    return getStorage().updateTask(id, input)
  })

  ipcMain.handle('task:delete', async (_, id: string) => {
    getStorage().deleteTask(id)
    return true
  })

  ipcMain.handle('task:start', async (_, id: string) => {
    return getStorage().updateTask(id, { status: 'running' })
  })

  ipcMain.handle('task:complete', async (_, id: string) => {
    return getStorage().updateTask(id, { status: 'completed' })
  })

  ipcMain.handle('task:fail', async (_, id: string, notes: string) => {
    return getStorage().updateTask(id, { status: 'failed', notes })
  })

  ipcMain.handle('task:cancel', async (_, id: string) => {
    return getStorage().updateTask(id, { status: 'cancelled' })
  })

  ipcMain.handle('task:listByWorkspace', async (_, workspaceId: string) => {
    return getStorage().listTasksByWorkspace(workspaceId)
  })

  // ===================== Session =====================

  ipcMain.handle('session:listByTask', async (_, taskId: string) => {
    return getStorage().listSessionsByTask(taskId)
  })

  ipcMain.handle('session:get', async (_, id: string) => {
    return getStorage().getSession(id)
  })

  ipcMain.handle('session:create', async (_, taskId: string, title?: string) => {
    return getStorage().createSession(taskId, title)
  })

  ipcMain.handle('session:delete', async (_, id: string) => {
    getStorage().deleteSession(id)
    return true
  })

  ipcMain.handle('session:update', async (_, id: string, input: Partial<ChatSession>) => {
    return getStorage().updateSession(id, input)
  })

  ipcMain.handle('message:listBySession', async (_, sessionId: string) => {
    return getStorage().listMessagesBySession(sessionId)
  })

  ipcMain.handle('message:send', async (_, sessionId: string, content: string) => {
    return getStorage().addMessage(sessionId, {
      sender: 'user',
      content,
      codeBlocks: [],
      attachments: [],
    })
  })

  // ===================== Artifact =====================

  ipcMain.handle('artifact:listByTask', async (_, taskId: string) => {
    return getStorage().listArtifactsByTask(taskId)
  })

  ipcMain.handle('artifact:get', async (_, id: string) => {
    return getStorage().getArtifact(id)
  })

  ipcMain.handle('artifact:add', async (_, artifact) => {
    return getStorage().addArtifact(artifact)
  })

  ipcMain.handle('artifact:update', async (_, id: string, input: Partial<Artifact>) => {
    return getStorage().updateArtifact(id, input)
  })

  ipcMain.handle('artifact:delete', async (_, id: string) => {
    getStorage().deleteArtifact(id)
    return true
  })

  // ===================== Git =====================

  /**
   * 获取任务关联的工作空间路径
   */
  function getWorkspacePath(taskId: string): string | null {
    const task = getStorage().getTask(taskId)
    if (!task) return null
    const workspace = getStorage().getWorkspace(task.workspaceId)
    if (!workspace) return null
    return workspace.rootPath
  }

  /**
   * 获取任务的 Git 变更列表
   * 返回：{ path, changeType }[]
   */
  ipcMain.handle('git:status', async (_, taskId: string) => {
    const repoPath = getWorkspacePath(taskId)
    if (!repoPath) return { error: '工作空间不存在' }

    try {
      const git: SimpleGit = simpleGit({ baseDir: repoPath })
      const isRepo = await git.checkIsRepo()
      if (!isRepo) return { error: '不是 Git 仓库' }

      const status = await git.status()
      return {
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        conflicted: status.conflicted,
      }
    } catch (e: any) {
      return { error: e.message ?? 'Git 操作失败' }
    }
  })

  /**
   * 扫描任务工作空间的 Git 变更并创建制品
   */
  ipcMain.handle('git:scanChanges', async (_, taskId: string) => {
    const repoPath = getWorkspacePath(taskId)
    if (!repoPath) return { error: '工作空间不存在' }

    try {
      const git: SimpleGit = simpleGit({ baseDir: repoPath })
      const isRepo = await git.checkIsRepo()
      if (!isRepo) return { error: '不是 Git 仓库' }

      const status = await git.status()

      const storage = getStorage()
      const createdArtifacts: any[] = []

      // 新增文件
      for (const file of status.created) {
        const artifact = storage.addArtifact({
          taskId,
          type: 'file',
          name: file,
          path: path.join(repoPath, file),
          gitChangeType: 'added',
          isNew: true,
        })
        createdArtifacts.push(artifact)
      }

      // 修改文件
      for (const file of status.modified) {
        const artifact = storage.addArtifact({
          taskId,
          type: 'file',
          name: file,
          path: path.join(repoPath, file),
          gitChangeType: 'modified',
          isNew: false,
        })
        createdArtifacts.push(artifact)
      }

      // 删除文件
      for (const file of status.deleted) {
        const artifact = storage.addArtifact({
          taskId,
          type: 'file',
          name: file,
          path: path.join(repoPath, file),
          gitChangeType: 'deleted',
          isNew: false,
        })
        createdArtifacts.push(artifact)
      }

      return { count: createdArtifacts.length, artifacts: createdArtifacts }
    } catch (e: any) {
      return { error: e.message ?? '扫描变更失败' }
    }
  })
}
