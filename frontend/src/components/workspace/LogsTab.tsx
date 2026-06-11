import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Download, Trash2 } from 'lucide-react'
import { 
  ScrollArea, 
  Button, 
  Group, 
  Text, 
  Badge, 
  Checkbox,
  Stack,
} from '@mantine/core'
import type { Task } from '@/types/workspace'

// ---------------------------------------------------------------
// LogsTab - 运行日志标签页
// ---------------------------------------------------------------
interface LogsTabProps {
  task: Task
  workspacePath?: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
}

// 模拟日志数据（开发阶段）
const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', source: 'agent', message: '[规划] 分析任务需求...' },
  { id: '2', timestamp: new Date(Date.now() - 4500).toISOString(), level: 'info', source: 'agent', message: '[规划] 识别到需要修改 src/main.ts 文件' },
  { id: '3', timestamp: new Date(Date.now() - 4000).toISOString(), level: 'info', source: 'agent', message: '[执行] 读取文件 src/main.ts (2.3KB)' },
  { id: '4', timestamp: new Date(Date.now() - 3500).toISOString(), level: 'debug', source: 'fs', message: '[FS] 缓存命中: src/main.ts' },
  { id: '5', timestamp: new Date(Date.now() - 3000).toISOString(), level: 'info', source: 'agent', message: '[执行] 调用 edit_file 修改第 12-15 行...' },
  { id: '6', timestamp: new Date(Date.now() - 2500).toISOString(), level: 'info', source: 'fs', message: '[FS] 写入文件 src/main.ts (2.4KB)' },
  { id: '7', timestamp: new Date(Date.now() - 2000).toISOString(), level: 'info', source: 'agent', message: '[执行] 运行 npm run build...' },
  { id: '8', timestamp: new Date(Date.now() - 1500).toISOString(), level: 'warn', source: 'build', message: '[Build] webpack: WARNING: deprecated loader (ignored)' },
  { id: '9', timestamp: new Date(Date.now() - 1000).toISOString(), level: 'info', source: 'build', message: '[Build] ✓ 编译成功 (1.2s)' },
  { id: '10', timestamp: new Date(Date.now() - 500).toISOString(), level: 'info', source: 'agent', message: '[验证] 运行测试...' },
  { id: '11', timestamp: new Date().toISOString(), level: 'info', source: 'test', message: '[Test] ✓ 15/15 测试通过' },
]

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  info: { label: '信息', color: 'blue' },
  warn: { label: '警告', color: 'yellow' },
  error: { label: '错误', color: 'red' },
  debug: { label: '调试', color: 'gray' },
}

export function LogsTab({ task }: LogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('all') // 'all' | 'info' | 'warn' | 'error' | 'debug'
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      // TODO: 通过 IPC 从主进程读取日志文件
      // const result = await window.api.taskGetLogs(task.id)
      // setLogs(result.logs)

      // 模拟加载延迟
      await new Promise(r => setTimeout(r, 500))
      setLogs(MOCK_LOGS)
    } catch (err: any) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadLogs()
  }, [task.id])

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  const handleClearLogs = () => {
    if (confirm('确定要清空日志吗？')) {
      setLogs([])
      // TODO: await window.api.taskClearLogs(task.id)
    }
  }

  const handleDownloadLogs = () => {
    const content = logs.map(l =>
      `[${new Date(l.timestamp).toLocaleTimeString('zh-CN')}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-${task.id}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const levelCounts = logs.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Stack h="100%" gap={0}>
      {/* Header */}
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="sm">
          <Text size="sm" fw={500}>运行日志</Text>
          {logs.length > 0 && (
            <Text size="xs" c="dimmed">
              {logs.length} 条日志
            </Text>
          )}
        </Group>
        <Group gap="xs">
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            leftSection={<Download size={14} />}
          >
            下载
          </Button>
          <Button
            variant="subtle"
            size="compact-sm"
            color="red"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            leftSection={<Trash2 size={14} />}
          >
            清空
          </Button>
          <Button
            variant="outline"
            size="compact-sm"
            onClick={loadLogs}
            disabled={loading}
            leftSection={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          >
            刷新
          </Button>
        </Group>
      </Group>

      {/* Filter bar */}
      <Group gap="xs" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        {[
          { key: 'all', label: '全部', count: logs.length },
          { key: 'info', label: '信息', count: levelCounts.info || 0 },
          { key: 'warn', label: '警告', count: levelCounts.warn || 0 },
          { key: 'error', label: '错误', count: levelCounts.error || 0 },
          { key: 'debug', label: '调试', count: levelCounts.debug || 0 },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'filled' : 'subtle'}
            size="compact-xs"
            color={filter === f.key ? 'blue' : 'gray'}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count > 0 && (
              <Badge 
                size="xs" 
                color={f.key === 'all' ? 'blue' : LEVEL_CONFIG[f.key]?.color || 'gray'}
                style={{ marginLeft: 4 }}
              >
                {f.count}
              </Badge>
            )}
          </Button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <Checkbox 
            label="自动滚动" 
            checked={autoScroll} 
            onChange={(e) => setAutoScroll(e.currentTarget.checked)}
            size="xs"
          />
        </div>
      </Group>

      {/* Log entries */}
      <ScrollArea style={{ flex: 1 }} ref={scrollRef}>
        {filteredLogs.length === 0 ? (
          <Stack align="center" py="xl" c="dimmed">
            <Text size="sm">
              {loading ? '加载中...' : filter === 'all' ? '暂无日志' : `无${filter}级别日志`}
            </Text>
          </Stack>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {filteredLogs.map(entry => {
              const config = LEVEL_CONFIG[entry.level] || LEVEL_CONFIG.info
              return (
                <Group 
                  key={entry.id} 
                  gap="sm" 
                  px="md" 
                  py={2}
                  style={{ 
                    borderBottom: '1px solid var(--mantine-color-gray-1)',
                    '&:hover': {
                      backgroundColor: 'var(--mantine-color-gray-0)',
                    }
                  }}
                >
                  {/* Timestamp */}
                  <Text size="xs" c="dimmed" style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
                    {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>

                  {/* Level badge */}
                  <Badge 
                    size="xs" 
                    color={config.color}
                    style={{ width: 40, flexShrink: 0 }}
                  >
                    {config.label}
                  </Badge>

                  {/* Source */}
                  <Text size="xs" c="dimmed" style={{ width: 64, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    [{entry.source}]
                  </Text>

                  {/* Message */}
                  <Text 
                    size="xs" 
                    style={{ 
                      flex: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: entry.level === 'error' ? 'var(--mantine-color-red-6)' : 
                            entry.level === 'warn' ? 'var(--mantine-color-yellow-6)' : 
                            'inherit',
                    }}
                  >
                    {entry.message}
                  </Text>
                </Group>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </Stack>
  )
}
