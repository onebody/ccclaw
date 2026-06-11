import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { 
  Group, 
  Text, 
  ActionIcon, 
  Badge, 
  Divider,
  Stack,
  Button,
  Modal,
} from '@mantine/core'
import { useWorkspaces, useActiveWorkspace } from '@/hooks/useWorkspace'
import { useWorkspaceTasks, useTasks } from '@/hooks/useTask'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'
import { CreateTaskDialog } from './CreateTaskDialog'
import { TaskItem } from './TaskItem'
import type { Workspace } from '@/types/workspace'

const WORKSPACE_COLORS = [
  { name: '默认蓝', value: '#3b82f6' },
  { name: '绿色', value: '#22c55e' },
  { name: '紫色', value: '#a855f7' },
  { name: '红色', value: '#ef4444' },
  { name: '黄色', value: '#eab308' },
  { name: '青色', value: '#06b6d4' },
]

export { WORKSPACE_COLORS }

// Workspace color dot
function WsColorDot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        marginRight: 8,
      }}
    />
  )
}

// Task count badge inside workspace
function TaskCountBadge({ workspaceId }: { workspaceId: string }) {
  const { tasks } = useWorkspaceTasks(workspaceId)
  if (!tasks.length) return null
  const running = tasks.filter(t => t.status === 'running').length
  return (
    <Badge 
      size="xs" 
      variant="dot" 
      color={running > 0 ? 'blue' : 'gray'}
      style={{ marginLeft: 'auto' }}
    >
      {tasks.length}
    </Badge>
  )
}

// Single task list for a workspace (collapsible)
function WorkspaceTaskList({ workspaceId, isOpen }: { workspaceId: string; isOpen: boolean }) {
  const { tasks } = useWorkspaceTasks(isOpen ? workspaceId : null)

  if (!isOpen || !tasks.length) return null

  return (
    <Stack gap="xs" pl="md" py="xs" style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }}>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </Stack>
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
      <div>
        <Group 
          gap="xs" 
          p="xs" 
          style={{ 
            cursor: 'pointer',
            borderRadius: '6px',
            backgroundColor: workspace.isActive ? 'var(--mantine-color-gray-1)' : 'transparent',
            fontWeight: workspace.isActive ? 600 : 400,
          }}
          onClick={handleActivate}
        >
          {/* Expand toggle */}
          <ActionIcon 
            size="xs" 
            variant="subtle"
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </ActionIcon>

          {/* Color dot + name */}
          <WsColorDot color={workspace.color} />
          <Text size="sm" truncate style={{ flex: 1 }}>
            {workspace.name}
          </Text>

          {/* Task count */}
          <TaskCountBadge workspaceId={workspace.id} />

          {/* Add task */}
          <ActionIcon 
            size="xs" 
            variant="subtle"
            color="blue"
            onClick={(e) => { e.stopPropagation(); setCreateTaskOpen(true) }}
            title="新建任务"
            style={{ opacity: 0.5 }}
          >
            <Plus size={14} />
          </ActionIcon>

          {/* Context menu trigger */}
          <ActionIcon 
            size="xs" 
            variant="subtle"
            onClick={(e) => { e.stopPropagation() }}
            style={{ opacity: 0.5 }}
          >
            <MoreHorizontal size={14} />
          </ActionIcon>
        </Group>

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
      <Stack h="100%" justify="space-between">
        {/* Header */}
        <Group justify="space-between" px="md" py="sm">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">工作空间</Text>
          <ActionIcon 
            size="sm" 
            variant="subtle"
            onClick={() => setCreateOpen(true)}
            title="新建工作空间"
          >
            <Plus size={16} />
          </ActionIcon>
        </Group>

        <Divider />

        {/* Workspace list */}
        <Stack gap="xs" style={{ flex: 1, overflowY: 'auto' }} px="xs" py="xs">
          {loading ? (
            <Text size="sm" c="dimmed" ta="center" py="md">加载中...</Text>
          ) : workspaces.length === 0 ? (
            <Stack gap="xs" align="center" py="md">
              <Text size="sm" c="dimmed">暂无工作空间</Text>
              <Button 
                variant="subtle" 
                size="xs"
                onClick={() => setCreateOpen(true)}
              >
                创建第一个工作空间
              </Button>
            </Stack>
          ) : (
            workspaces.map(ws => (
              <WorkspaceItem
                key={ws.id}
                workspace={ws}
              />
            ))
          )}
        </Stack>

        {/* Footer: collapse all */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button 
            variant="subtle" 
            size="xs"
            fullWidth
            leftSection={<ChevronRight size={14} />}
            onClick={() => {/* TODO: collapse all */}}
          >
            折叠全部
          </Button>
        </div>
      </Stack>

      {/* Create dialog */}
      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async input => { await create(input) }}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Modal 
          opened={!!deleteConfirm} 
          onClose={() => setDeleteConfirm(null)}
          title="确认删除"
          size="sm"
        >
          <Text size="sm" mb="md">
            删除工作空间会同时删除所有关联任务和会话，且不可恢复。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button 
              color="red" 
              onClick={() => handleDelete(deleteConfirm)}
            >
              删除
            </Button>
          </Group>
        </Modal>
      )}
    </>
  )
}
