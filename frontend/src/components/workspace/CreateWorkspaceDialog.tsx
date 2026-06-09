import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
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

const COLOR_HEX: Record<WorkspaceColor, string> = {
  blue: '#1f6feb',
  green: '#238636',
  purple: '#8957e5',
  red: '#da3633',
  yellow: '#d29922',
  cyan: '#58a6ff',
  orange: '#db6d28',
  gray: '#6e7681',
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            新建工作空间
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">工作空间名称</Label>
            <Input
              id="ws-name"
              placeholder="例如：ccclaw 开发"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Path */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-rootPath">本地目录</Label>
            <div className="flex gap-2">
              <Input
                id="ws-rootPath"
                placeholder="选择或输入本地目录路径"
                value={rootPath}
                onChange={e => setRootPath(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleBrowse}>
                浏览
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              工作空间将关联此目录，所有文件操作和 Git 变更都在该目录下执行。
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-desc">描述（可选）</Label>
            <Input
              id="ws-desc"
              placeholder="简短描述此工作空间的用途"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>颜色标识</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: COLOR_HEX[c],
                    borderColor: color === c ? COLOR_HEX[c] : 'transparent',
                  }}
                  onClick={() => setColor(c)}
                  title={COLOR_LABELS[c]}
                />
              ))}
            </div>
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
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
