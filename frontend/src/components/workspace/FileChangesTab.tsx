import { useState } from 'react'
import {
  Badge,
  Button,
  ScrollArea,
  Group,
  Stack,
  Text,
  Box,
  Divider,
  SegmentedControl,
} from '@mantine/core'
import {
  GitBranch,
  FileText,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react'

// ----------------------------------------------------------------
// Git diff types (local definition)
// ----------------------------------------------------------------

interface GitDiffLine {
  type: 'context' | 'added' | 'removed'
  oldLine: number | null
  newLine: number | null
  content: string
}

interface GitDiffHunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: GitDiffLine[]
}

interface GitDiffFile {
  path: string
  oldPath?: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  hunks?: GitDiffHunk[]
}

// ----------------------------------------------------------------
// FileChangesTab props
// ----------------------------------------------------------------

interface FileChangesTabProps {
  taskId: string
  workspacePath?: string
}

// ----------------------------------------------------------------
// Status config
// ----------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  added:    { label: '+ 新增',    color: 'green' },
  modified: { label: '~ 修改',    color: 'blue' },
  deleted:  { label: '- 删除',    color: 'red' },
  renamed:  { label: '→ 重命名',  color: 'grape' },
}

const STATUS_ICON_COLOR: Record<string, string> = {
  added:    'var(--mantine-color-green-5)',
  modified: 'var(--mantine-color-blue-5)',
  deleted:  'var(--mantine-color-red-5)',
  renamed:  'var(--mantine-color-grape-5)',
}

const DIFF_BG: Record<string, string> = {
  added:   'var(--mantine-color-green-0)',
  removed: 'var(--mantine-color-red-0)',
}

const DIFF_COLOR: Record<string, string> = {
  added:   'var(--mantine-color-green-7)',
  removed: 'var(--mantine-color-red-7)',
}

const spinStyle = { animation: 'spin 1s linear infinite' }

// ----------------------------------------------------------------
// FileChangesTab - 文件变更标签页
// ----------------------------------------------------------------
export function FileChangesTab({ taskId: _taskId, workspacePath }: FileChangesTabProps) {
  void _taskId
  const [diffFiles, setDiffFiles] = useState<GitDiffFile[]>([])
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<string>('unstaged')

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
          status: 'modified',
          hunks: [
            {
              oldStart: 10,
              oldLines: 5,
              newStart: 10,
              newLines: 7,
              header: '@@ -10,5 +10,7 @@',
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
          status: 'added',
          hunks: [
            {
              oldStart: 0,
              oldLines: 0,
              newStart: 1,
              newLines: 15,
              header: '@@ -0,0 +1,15 @@',
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
          status: 'deleted',
          hunks: [],
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const activeFileData = diffFiles.find(f => f.path === activeFile)

  // --- Empty workspace state ---
  if (!workspacePath) {
    return (
      <Stack align="center" justify="center" h="100%" p="md" c="dimmed">
        <GitBranch size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
        <Text size="sm">未选择工作空间</Text>
      </Stack>
    )
  }

  return (
    <Stack h="100%" gap={0}>
      {/* Header */}
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }} wrap="nowrap">
        <Group gap="xs">
          <Text size="sm" fw={500}>文件变更</Text>
          {diffFiles.length > 0 && (
            <Badge variant="light" size="xs">
              {diffFiles.length}
            </Badge>
          )}
        </Group>

        <Group gap="xs">
          {/* View mode toggle */}
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={setViewMode}
            data={[
              { label: '工作区', value: 'unstaged' },
              { label: '暂存区', value: 'staged' },
            ]}
          />

          {/* Refresh button */}
          <Button
            variant="outline"
            size="compact-sm"
            onClick={loadDiff}
            disabled={loading}
            leftSection={<RefreshCw size={14} style={loading ? spinStyle : undefined} />}
          >
            {loading ? '加载中...' : '刷新'}
          </Button>
        </Group>
      </Group>

      {/* Content: file list + diff view */}
      <Group style={{ flex: 1, overflow: 'hidden' }} gap={0} wrap="nowrap" align="stretch">
        {/* File list sidebar */}
        <Box w={240} style={{ flexShrink: 0, borderRight: '1px solid var(--mantine-color-gray-3)', overflow: 'auto' }}>
          {diffFiles.length === 0 && !loading ? (
            <Stack align="center" p="md" c="dimmed">
              <Text size="xs">无变更文件</Text>
              <Button variant="subtle" size="compact-sm" onClick={loadDiff}>
                加载变更
              </Button>
            </Stack>
          ) : (
            <Stack gap={0} py={4}>
              {diffFiles.map(file => (
                <Box
                  key={file.path}
                  component="button"
                  onClick={() => setActiveFile(file.path)}
                  px="sm"
                  py={6}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    border: 'none',
                    background: activeFile === file.path
                      ? 'var(--mantine-color-accent, #25262b)'
                      : 'transparent',
                    color: activeFile === file.path
                      ? 'var(--mantine-color-accent-foreground, #c1c2c5)'
                      : 'var(--mantine-color-dimmed, #909296)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {file.status === 'added' && <Plus size={12} style={{ color: STATUS_ICON_COLOR.added, flexShrink: 0 }} />}
                  {file.status === 'modified' && <FileText size={12} style={{ color: STATUS_ICON_COLOR.modified, flexShrink: 0 }} />}
                  {file.status === 'deleted' && <Minus size={12} style={{ color: STATUS_ICON_COLOR.deleted, flexShrink: 0 }} />}
                  <Box style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.path.split('/').pop()}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Divider orientation="vertical" />

        {/* Diff view */}
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          {activeFileData ? (
            <ScrollArea h="100%">
              <Box p={4}>
                {/* File header */}
                <Group gap="xs" px="sm" py="xs" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', marginBottom: 8 }}>
                  <Text size="xs" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeFileData.path}
                  </Text>
                  <Badge variant="outline" size="xs" color={STATUS_CONFIG[activeFileData.status]?.color}>
                    {STATUS_CONFIG[activeFileData.status]?.label}
                  </Badge>
                  {activeFileData.oldPath && (
                    <Text size="xs" c="dimmed">
                      {activeFileData.oldPath} → {activeFileData.path}
                    </Text>
                  )}
                </Group>

                {/* Diff hunks */}
                {activeFileData.hunks && activeFileData.hunks.length === 0 ? (
                  <Box ta="center" py="xl" c="dimmed">
                    <Text size="xs">{activeFileData.status === 'deleted' ? '文件已删除' : '空文件'}</Text>
                  </Box>
                ) : (
                  <Box style={{ fontFamily: 'var(--mantine-font-family-monospace, monospace)', fontSize: 12 }}>
                    {activeFileData.hunks?.map((hunk, hunkIdx) => (
                      <Box key={hunkIdx} mb={8}>
                        {/* Hunk header */}
                        <Group px="sm" py={2} c="dimmed" wrap="nowrap" style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                          <Text size="xs" ff="monospace">
                            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                          </Text>
                        </Group>

                        {/* Diff lines */}
                        {hunk.lines.map((line, lineIdx) => (
                          <Group
                            key={lineIdx}
                            px={4} py={0}
                            gap={0}
                            wrap="nowrap"
                            style={{
                              backgroundColor: line.type === 'added' ? DIFF_BG.added
                                : line.type === 'removed' ? DIFF_BG.removed
                                : undefined,
                            }}
                          >
                            {/* Line numbers */}
                            <Text size="xs" w={40} ta="right" pr={8} c="dimmed" style={{ opacity: 0.5, userSelect: 'none', flexShrink: 0 }}>
                              {line.oldLine ?? ''}
                            </Text>
                            <Text size="xs" w={40} ta="right" pr={8} c="dimmed" style={{ opacity: 0.5, userSelect: 'none', flexShrink: 0 }}>
                              {line.newLine ?? ''}
                            </Text>

                            {/* Operator indicator */}
                            <Box w={16} ta="center" style={{ flexShrink: 0 }}>
                              {line.type === 'added' && <Text size="xs" c={DIFF_COLOR.added} span>+</Text>}
                              {line.type === 'removed' && <Text size="xs" c={DIFF_COLOR.removed} span>-</Text>}
                              {line.type === 'context' && <Text size="xs" c="dimmed" span> </Text>}
                            </Box>

                            {/* Content */}
                            <Text
                              size="xs"
                              span
                              style={{
                                flex: 1,
                                whiteSpace: 'pre',
                                fontFamily: 'var(--mantine-font-family-monospace, monospace)',
                                color: line.type === 'added' ? DIFF_COLOR.added
                                  : line.type === 'removed' ? DIFF_COLOR.removed
                                  : undefined,
                                opacity: line.type === 'context' ? 0.7 : undefined,
                              }}
                            >
                              {line.content}
                            </Text>
                          </Group>
                        ))}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </ScrollArea>
          ) : (
            <Stack align="center" justify="center" h="100%" c="dimmed">
              <FileText size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <Text size="sm">选择文件查看变更</Text>
            </Stack>
          )}
        </Box>
      </Group>
    </Stack>
  )
}
