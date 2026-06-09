import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/hooks/useTask'
import type { Task } from '@/types/workspace'

type TaskStatus = Task['status']

const STATUS_CONFIG: Record<TaskStatus, {
  label: string
  variant: 'pending' | 'running' | 'completed' | 'failed' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  dotClass: string
}> = {
  pending: {
    label: '待执行',
    variant: 'pending',
    icon: Clock,
    dotClass: 'bg-yellow-400',
  },
  running: {
    label: '运行中',
    variant: 'running',
    icon: PlayCircle,
    dotClass: 'bg-blue-500 animate-pulse',
  },
  completed: {
    label: '已完成',
    variant: 'completed',
    icon: CheckCircle2,
    dotClass: 'bg-green-500',
  },
  failed: {
    label: '失败',
    variant: 'failed',
    icon: XCircle,
    dotClass: 'bg-red-500',
  },
  cancelled: {
    label: '已取消',
    variant: 'outline',
    icon: XCircle,
    dotClass: 'bg-muted',
  },
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className="gap-1 text-xs px-1.5 py-0">
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </Badge>
  )
}

interface TaskItemProps {
  task: Task
  workspaceId?: string
}

export function TaskItem({ task, workspaceId }: TaskItemProps) {
  const { start, complete, fail } = useTasks(
    workspaceId ? { workspaceId } : undefined
  )

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
    <div className="group">
      <div
        className={cn(
          "flex items-center gap-2 h-7 px-2 rounded-md text-xs cursor-pointer transition-colors",
          "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
        )}
      >
        {/* Status dot */}
        <span className={cn(
          'h-1.5 w-1.5 rounded-full flex-shrink-0',
          STATUS_CONFIG[task.status].dotClass
        )} />

        {/* Task name */}
        <span className="truncate flex-1 min-w-0">{task.title}</span>

        {/* Date */}
        <span className="text-muted-foreground/60 flex-shrink-0">
          {formatDate(task.createdAt)}
        </span>

        {/* Quick actions (show on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
          {task.status === 'pending' && (
            <button
              className="p-0.5 rounded hover:bg-blue-500/20 text-blue-500"
              onClick={handleStart}
              title="开始任务"
            >
              <PlayCircle className="h-3 w-3" />
            </button>
          )}
          {task.status === 'running' && (
            <>
              <button
                className="p-0.5 rounded hover:bg-green-500/20 text-green-500"
                onClick={handleComplete}
                title="标记完成"
              >
                <CheckCircle2 className="h-3 w-3" />
              </button>
              <button
                className="p-0.5 rounded hover:bg-red-500/20 text-red-500"
                onClick={e => { e.stopPropagation(); fail(task.id, '') }}
                title="标记失败"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export { TaskStatusBadge, STATUS_CONFIG }
