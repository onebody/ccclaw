import { useState } from 'react'
import { ListTodo } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { TaskCreateInput, TaskPriority } from '@/types/workspace'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: TaskCreateInput) => Promise<void>
  workspaceId: string
  workspaceName?: string
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: '紧急', color: 'text-red-500' },
  { value: 'high', label: '高', color: 'text-orange-500' },
  { value: 'normal', label: '普通', color: 'text-blue-500' },
  { value: 'low', label: '低', color: 'text-muted-foreground' },
]

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreate,
  workspaceId,
  workspaceName,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('请输入任务标题'); return }

    setLoading(true)
    setError('')
    try {
      await onCreate({
        workspaceId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      })
      setTitle(''); setDescription(''); setPriority('normal')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { setTitle(''); setDescription(''); setPriority('normal'); setError('') }
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            新建任务
          </DialogTitle>
          {workspaceName && (
            <p className="text-sm text-muted-foreground font-normal">
              工作空间：{workspaceName}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">任务标题 *</Label>
            <Input
              id="task-title"
              placeholder="例如：完成用户认证功能"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">描述（可选）</Label>
            <Textarea
              id="task-desc"
              placeholder="详细描述任务内容、目标或期望结果..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="task-priority">优先级</Label>
            <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
              <SelectTrigger id="task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span className={opt.color}>●</span>
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建任务'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
