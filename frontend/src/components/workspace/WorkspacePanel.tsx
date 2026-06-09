import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useWorkspaces, useActiveWorkspace } from '@/hooks/useWorkspace'
import { useWorkspaceTasks, useTasks } from '@/hooks/useTask'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'
import { CreateTaskDialog } from './CreateTaskDialog'
import { TaskItem } from './TaskItem'
import type { Workspace } from '@/types/workspace'

const WORKSPACE_COLORS = [
  { name: '默认蓝', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: '绿色', value: '#22c55e', bg: 'bg-green-500' },
  { name: '紫色', value: '#a855f7', bg: 'bg-purple-500' },
  { name: '红色', value: '#ef4444', bg: 'bg-red-500' },
  { name: '黄色', value: '#eab308', bg: 'bg-yellow-500' },
  { name: '青色', value: '#06b6d4', bg: 'bg-cyan-500' },
]

export { WORKSPACE_COLORS }

// Workspace color dot
function WsColorDot({ color }: { color: string }) {
  return (
    <span
      className="mr-2 inline-block h-2 w-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

// Task count badge inside workspace
function TaskCountBadge({ workspaceId }: { workspaceId: string }) {
  const { tasks } = useWorkspaceTasks(workspaceId)
  if (!tasks.length) return null
  const running = tasks.filter(t => t.status === 'running').length
  return (
    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
      {running > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
      <span>{tasks.length}</span>
    </span>
  )
}

// Single task list for a workspace (collapsible)
function WorkspaceTaskList({ workspaceId, isOpen }: { workspaceId: string; isOpen: boolean }) {
  const { tasks } = useWorkspaceTasks(isOpen ? workspaceId : null)

  if (!isOpen || !tasks.length) return null

  return (
    <div className="ml-4 border-l border-border pl-3 space-y-0.5 py-1">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}

// Context menu state per workspace
function WorkspaceItem({ workspace }: { workspace: Workspace }) {
  const { activate } = useActiveWorkspace()
  const { create: createTask } = useTasks()
  const [expanded, setExpanded] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const handleActivate = useCallback(() => {
    activate(workspace.id)
  }, [activate, workspace.id])

  const handleCreateTask = async (input: any) => {
    await createTask({ ...input, workspaceId: workspace.id })
  }

  return (
    <>
      <div className="group">
        <div
          className={cn(
            "flex items-center h-8 px-2 rounded-md text-sm cursor-pointer select-none transition-colors",
            workspace.isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          )}
          onClick={handleActivate}
        >
          {/* Expand toggle */}
          <button
            className="mr-1 p-0.5 rounded hover:bg-accent flex-shrink-0"
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {/* Color dot + name */}
          <WsColorDot color={workspace.color} />
          <span className="truncate flex-1 min-w-0">{workspace.name}</span>

          {/* Task count */}
          <TaskCountBadge workspaceId={workspace.id} />

          {/* Add task */}
          <button
            className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 text-blue-500 flex-shrink-0"
            onClick={e => { e.stopPropagation(); setCreateTaskOpen(true) }}
            title="新建任务"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* Context menu trigger */}
          <button
            className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent flex-shrink-0"
            onClick={e => { e.stopPropagation() }}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Collapsible task list */}
        <WorkspaceTaskList workspaceId={workspace.id} isOpen={expanded} />
      </div>

      {/* Create task dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreate={handleCreateTask}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </>
  )
}

// Main workspace panel
export function WorkspacePanel() {
  const { workspaces, loading, create, remove } = useWorkspaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    await remove(id)
    setDeleteConfirm(null)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">工作空间</span>
          <button
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setCreateOpen(true)}
            title="新建工作空间"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Separator />

        {/* Workspace list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {loading ? (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">加载中...</div>
          ) : workspaces.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">
              暂无工作空间
              <br />
              <button
                className="mt-2 text-xs text-blue-500 hover:underline"
                onClick={() => setCreateOpen(true)}
              >
                创建第一个工作空间
              </button>
            </div>
          ) : (
            workspaces.map(ws => (
              <WorkspaceItem
                key={ws.id}
                workspace={ws}
              />
            ))
          )}
        </div>

        {/* Footer: collapse all */}
        <div className="flex-shrink-0 px-2 py-2 border-t">
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => {/* TODO: collapse all */}}
          >
            <ChevronRight className="h-3.5 w-3.5" />
            折叠全部
          </button>
        </div>
      </div>

      {/* Create dialog */}
      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async input => { await create(input) }}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-muted-foreground mb-4">
              删除工作空间会同时删除所有关联任务和会话，且不可恢复。
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors"
                onClick={() => setDeleteConfirm(null)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                onClick={() => handleDelete(deleteConfirm)}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
