import { useState } from 'react'
import { ListTodo } from 'lucide-react'
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Text,
} from '@mantine/core'
import type { TaskCreateInput, TaskPriority } from '@/types/workspace'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: TaskCreateInput) => Promise<void>
  workspaceId: string
  workspaceName?: string
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: '紧急', color: 'red' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'normal', label: '普通', color: 'blue' },
  { value: 'low', label: '低', color: 'gray' },
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
    <Modal
      opened={open}
      onClose={() => handleOpenChange(false)}
      title={
        <Group gap="xs">
          <ListTodo size={18} />
          新建任务
        </Group>
      }
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Title */}
          <TextInput
            label="任务标题 *"
            placeholder="例如：完成用户认证功能"
            value={title}
            onChange={e => setTitle(e.currentTarget.value)}
            required
            size="sm"
          />

          {/* Description */}
          <Textarea
            label="描述（可选）"
            placeholder="详细描述任务内容、目标或期望结果..."
            value={description}
            onChange={e => setDescription(e.currentTarget.value)}
            minRows={3}
            maxRows={6}
            size="sm"
          />

          {/* Priority */}
          <Select
            label="优先级"
            value={priority}
            onChange={v => setPriority(v as TaskPriority)}
            size="sm"
            data={PRIORITY_OPTIONS.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
          />

          {workspaceName && (
            <Text size="sm" c="dimmed">
              工作空间：{workspaceName}
            </Text>
          )}

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              size="sm"
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="sm"
            >
              {loading ? '创建中...' : '创建任务'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
