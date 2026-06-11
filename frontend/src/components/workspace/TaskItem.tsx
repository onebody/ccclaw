import { useNavigate } from 'react-router-dom'
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Badge, Group, Text, ActionIcon } from '@mantine/core'
import { useTasks } from '@/hooks/useTask'
import type { Task } from '@/types/workspace'

type TaskStatus = Task['status']

const STATUS_CONFIG: Record<TaskStatus, {
  label: string
  variant: 'pending' | 'running' | 'completed' | 'failed' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  pending: {
    label: '待执行',
    variant: 'pending',
    icon: Clock,
    color: 'yellow',
  },
  running: {
    label: '运行中',
    variant: 'running',
    icon: PlayCircle,
    color: 'blue',
  },
  completed: {
    label: '已完成',
    variant: 'completed',
    icon: CheckCircle2,
    color: 'green',
  },
  failed: {
    label: '失败',
    variant: 'failed',
    icon: XCircle,
    color: 'red',
  },
  cancelled: {
    label: '已取消',
    variant: 'outline',
    icon: XCircle,
    color: 'gray',
  },
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge 
      variant="light" 
      color={config.color as any}
      size="xs"
    >
      {config.label}
    </Badge>
  )
}

interface TaskItemProps {
  task: Task
  workspaceId?: string
}

export function TaskItem({ task, workspaceId }: TaskItemProps) {
  const navigate = useNavigate()
  const { start, complete, fail } = useTasks(
    workspaceId ? { workspaceId } : undefined
  )

  const handleClick = () => {
    navigate(`/tasks/${task.id}`)
  }

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await start(task.id)
  }

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await complete(task.id)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <Group 
      onClick={handleClick}
      gap="xs"
      p="xs"
      wrap="nowrap"
      style={{ cursor: 'pointer' }}
      className="task-item"
    >
      <TaskStatusBadge status={task.status} />
      
      <Text size="sm" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </Text>
      
      <Text size="xs" c="dimmed">{formatDate(task.createdAt)}</Text>
      
      <Group gap={4} className="task-item-actions">
        {task.status === 'pending' && (
          <ActionIcon 
            size="sm" 
            color="blue" 
            onClick={handleStart}
            title="开始任务"
          >
            <PlayCircle size={14} />
          </ActionIcon>
        )}
        {task.status === 'running' && (
          <>
              <ActionIcon 
                size="sm" 
                color="green" 
                onClick={handleComplete}
                title="标记完成"
              >
                <CheckCircle2 size={14} />
              </ActionIcon>
              <ActionIcon 
                size="sm" 
                color="red" 
                onClick={(e) => { e.stopPropagation(); fail(task.id, '') }}
                title="标记失败"
              >
                <XCircle size={14} />
              </ActionIcon>
          </>
        )}
      </Group>
    </Group>
  )
}

export { TaskStatusBadge, STATUS_CONFIG }
