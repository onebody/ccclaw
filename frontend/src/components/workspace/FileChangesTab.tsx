import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GitBranch,
  FileText,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react'
import type { GitDiffFile, GitDiffHunk } from '@/types/workspace'

// ----------------------------------------------------------------
// Git diff types (from backend)
// ----------------------------------------------------------------

interface FileChangesTabProps {
  taskId: string
  workspacePath?: string
}

// ----------------------------------------------------------------
// FileChangesTab - 文件变更标签页
// ----------------------------------------------------------------
export function FileChangesTab({ taskId, workspacePath }: FileChangesTabProps) {
  const [diffFiles, setDiffFiles] = useState<GitDiffFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'staged' | 'unstaged'>('unstaged')

  const loadDiff = async () => {
    if (!workspacePath) {
      setError('未设置工作空间路径')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // TODO: 通过 IPC 调用主进程的 git diff
      // const files = await window.api.gitDiff(taskId, viewMode === 'staged')
      // setDiffFiles(files)

      // 模拟数据（开发阶段）
      setDiffFiles([
        {
          path: 'src/main.ts',
          oldPath: null,
          status: 'modified',
          hunks: [
            {
              oldStart: 10,
              oldLines: 5,
              newStart: 10,
              newLines: 7,
              lines: [
                { type: 'context', oldLine: 10, newLine: 10, content: '  const app = express()' },
                { type: 'context', oldLine: 11, newLine: 11, content: '  app.use(cors())' },
                { type: 'removed', oldLine: 12, newLine: null, content: '  app.use(logger())' },
                { type: 'added', oldLine: null, newLine: 12, content: '  app.use(logger({ format: "combined" }))' },
                { type: 'added', oldLine: null, newLine: 13, content: '  app.use(rateLimit({ windowMs: 60000, max: 100 }))' },
                { type: 'context', oldLine: 13, newLine: 14, content: '' },
                { type: 'context', oldLine: 14, newLine: 15, content: '  app.get("/api/health", (req, res) => {' },
              ],
            },
          ],
        },
        {
          path: 'src/utils/helper.ts',
          oldPath: null,
          status: 'added',
          hunks: [
            {
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: 15,
              lines: [
                { type: 'added', oldLine: null, newLine: 1, content: 'export function formatDate(date: Date): string {' },
                { type: 'added', oldLine: null, newLine: 2, content: '  return date.toISOString()' },
                { type: 'added', oldLine: null, newLine: 3, content: '}' },
                { type: 'added', oldLine: null, newLine: 4, content: '' },
                { type: 'added', oldLine: null, newLine: 5, content: 'export function debounce<T>(fn: (...args: T[]) => void, ms: number): (...args: T[]) => void {' },
                { type: 'added', oldLine: null, newLine: 6, content: '  let timer: NodeJS.Timeout' },
                { type: 'added', oldLine: null, newLine: 7, content: '  return (...args: T[]) => {' },
                { type: 'added', oldLine: null, newLine: 8, content: '    clearTimeout(timer)' },
                { type: 'added', oldLine: null, newLine: 9, content: '    timer = setTimeout(() => fn(...args), ms)' },
                { type: 'added', oldLine: null, newLine: 10, content: '  }' },
                { type: 'added', oldLine: null, newLine: 11, content: '}' },
              ],
            },
          ],
        },
        {
          path: 'src/old/deprecated.ts',
          oldPath: null,
          status: 'deleted',
          hunks: [],
        },
      ])
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      added: { label: '+ 新增', class: 'bg-green-500/10 text-green-600 border-green-500/30' },
      modified: { label: '~ 修改', class: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      deleted: { label: '- 删除', class: 'bg-red-500/10 text-red-600 border-red-500/30' },
      renamed: { label: '→ 重命名', class: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
    }
    const c = config[status as keyof typeof config]
    if (!c) return null
    return (
      <Badge variant="outline" className={cn('text-xs', c.class)}>
        {c.label}
      </Badge>
    )
  }

  const getLanguageFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      ts: 'typescript', js: 'javascript', tsx: 'typescript', jsx: 'javascript',
      py: 'python', rb: 'ruby', java: 'java', go: 'go', rs: 'rust',
      json: 'json', yaml: 'yaml', yml: 'yaml', md: 'markdown',
      css: 'css', scss: 'scss', html: 'html', xml: 'xml',
    }
    return map[ext || ''] || 'text'
  }

  const activeFileData = diffFiles.find(f => f.path === activeFile)

  if (!workspacePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <GitBranch className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">未选择工作空间</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">文件变更</h3>
          {diffFiles.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {diffFiles.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              className={cn(
                'px-2 py-1 text-xs transition-colors',
                viewMode === 'unstaged'
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground'
              )}
              onClick={() => setViewMode('unstaged')}
            >
              工作区
            </button>
            <button
              className={cn(
                'px-2 py-1 text-xs transition-colors border-l',
                viewMode === 'staged'
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground'
              )}
              onClick={() => setViewMode('staged')}
            >
              暂存区
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDiff}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            {loading ? '加载中...' : '刷新'}
          </Button>
        </div>
      </div>

      {/* Content: file list + diff view */}
      <div className="flex-1 flex overflow-hidden">
        {/* File list sidebar */}
        <div className="w-[240px] flex-shrink-0 border-r overflow-auto">
          {diffFiles.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
              <p className="text-xs">无变更文件</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={loadDiff}>
                加载变更
              </Button>
            </div>
          ) : (
            <div className="py-1">
              {diffFiles.map(file => (
                <button
                  key={file.path}
                  onClick={() => setActiveFile(file.path)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2',
                    activeFile === file.path
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {file.status === 'added' && <Plus className="h-3 w-3 text-green-500 flex-shrink-0" />}
                  {file.status === 'modified' && <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                  {file.status === 'deleted' && <Minus className="h-3 w-3 text-red-500 flex-shrink-0" />}
                  <span className="truncate flex-1">{file.path.split('/').pop()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-full" />

        {/* Diff view */}
        <div className="flex-1 overflow-hidden">
          {activeFileData ? (
            <ScrollArea className="h-full">
              <div className="p-1">
                {/* File header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b mb-2">
                  <span className="text-xs font-medium truncate">{activeFileData.path}</span>
                  {getStatusBadge(activeFileData.status)}
                  {activeFileData.oldPath && (
                    <span className="text-xs text-muted-foreground">
                      {activeFileData.oldPath} → {activeFileData.path}
                    </span>
                  )}
                </div>

                {/* Diff hunks */}
                {activeFileData.hunks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs">{activeFileData.status === 'deleted' ? '文件已删除' : '空文件'}</p>
                  </div>
                ) : (
                  <div className="font-mono text-xs">
                    {activeFileData.hunks.map((hunk, hunkIdx) => (
                      <div key={hunkIdx} className="mb-2">
                        {/* Hunk header */}
                        <div className="px-3 py-0.5 bg-muted/50 text-muted-foreground">
                          @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                        </div>
                        {/* Diff lines */}
                        {hunk.lines.map((line, lineIdx) => (
                          <div
                            key={lineIdx}
                            className={cn(
                              'flex items-start px-1 py-0',
                              line.type === 'added' && 'bg-green-500/10',
                              line.type === 'removed' && 'bg-red-500/10',
                            )}
                          >
                            {/* Line numbers */}
                            <span className="w-10 text-right pr-2 select-none text-muted-foreground/50 flex-shrink-0">
                              {line.oldLine ?? ''}
                            </span>
                            <span className="w-10 text-right pr-2 select-none text-muted-foreground/50 flex-shrink-0">
                              {line.newLine ?? ''}
                            </span>
                            <span className="w-4 text-center flex-shrink-0">
                              {line.type === 'added' && <span className="text-green-500">+</span>}
                              {line.type === 'removed' && <span className="text-red-500">-</span>}
                              {line.type === 'context' && <span className="text-muted-foreground"> </span>}
                            </span>
                            <span
                              className={cn(
                                'flex-1 whitespace-pre font-mono',
                                line.type === 'added' && 'text-green-600 dark:text-green-400',
                                line.type === 'removed' && 'text-red-600 dark:text-red-400',
                                line.type === 'context' && 'text-foreground/70'
                              )}
                            >
                              {line.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">选择文件查看变更</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
