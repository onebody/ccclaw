import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { 
  Modal, 
  Stack, 
  Group, 
  Text, 
  TextInput, 
  Button, 
  Divider,
  ActionIcon,
} from '@mantine/core'
import type { WorkspaceCreateInput, WorkspaceColor } from '@/types/workspace'

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: WorkspaceCreateInput) => Promise<void>
}

const PRESET_COLORS: WorkspaceColor[] = ['blue', 'green', 'purple', 'red', 'yellow', 'cyan']

const COLOR_LABELS: Record<WorkspaceColor, string> = {
  blue: '蓝色',
  green: '绿色',
  purple: '紫色',
  red: '红色',
  yellow: '黄色',
  cyan: '青色',
  orange: '橙色',
  gray: '灰色',
}

export function CreateWorkspaceDialog({ open, onOpenChange, onCreate }: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('')
  const [rootPath, setRootPath] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<WorkspaceColor>('blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBrowse = async () => {
    try {
      const result = await (window as any).api.workspaceOpenDialog()
      if (result?.ok !== false && result) {
        setRootPath(result)
      }
    } catch {
      setRootPath('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('请输入工作空间名称'); return }
    if (!rootPath.trim()) { setError('请选择本地目录'); return }

    setLoading(true)
    setError('')
    try {
      await onCreate({
        name: name.trim(),
        rootPath: rootPath.trim(),
        description: description.trim(),
        color,
      })
      setName(''); setRootPath(''); setDescription(''); setColor('blue')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) { setName(''); setRootPath(''); setDescription(''); setColor('blue'); setError('') }
    onOpenChange(val)
  }

  return (
    <Modal 
      opened={open} 
      onClose={() => handleOpenChange(false)} 
      title={
        <Group gap="sm">
          <FolderOpen size={20} />
          <Text size="lg" fw={600}>新建工作空间</Text>
        </Group>
      }
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Name */}
          <TextInput
            label="工作空间名称"
            placeholder="例如：ccclaw 开发"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          {/* Path */}
          <div>
            <Text size="sm" fw={500} mb="xs">本地目录</Text>
            <Group gap="sm" align="flex-start">
              <TextInput
                placeholder="选择或输入本地目录路径"
                value={rootPath}
                onChange={(e) => setRootPath(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button 
                variant="outline" 
                onClick={handleBrowse}
                style={{ flexShrink: 0 }}
              >
                浏览
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              工作空间将关联此目录，所有文件操作和 Git 变更都在该目录下执行。
            </Text>
          </div>

          {/* Description */}
          <TextInput
            label="描述（可选）"
            placeholder="简短描述此工作空间的用途"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          {/* Color */}
          <div>
            <Text size="sm" fw={500} mb="xs">颜色标识</Text>
            <Group gap="sm">
              {PRESET_COLORS.map(c => (
                <ActionIcon
                  key={c}
                  size="lg"
                  radius="xl"
                  variant={color === c ? 'filled' : 'subtle'}
                  color={c}
                  onClick={() => setColor(c)}
                  title={COLOR_LABELS[c]}
                >
                  {COLOR_LABELS[c][0]}
                </ActionIcon>
              ))}
            </Group>
          </div>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              loading={loading}
            >
              {loading ? '创建中...' : '创建'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
