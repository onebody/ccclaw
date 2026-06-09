import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, Download, Trash2 } from 'lucide-react'
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

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  info: { label: '信息', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/5' },
  warn: { label: '警告', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/5' },
  error: { label: '错误', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/5' },
  debug: { label: '调试', color: 'text-muted-foreground', bg: 'bg-muted/20' },
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">运行日志</h3>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {logs.length} 条日志
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            className="h-7 px-2 gap-1"
            title="下载日志"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="h-7 px-2 gap-1 text-destructive hover:text-destructive"
            title="清空日志"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="h-7 px-2 gap-1"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-muted/20">
        {[
          { key: 'all', label: '全部', count: logs.length },
          { key: 'info', label: '信息', count: levelCounts.info || 0 },
          { key: 'warn', label: '警告', count: levelCounts.warn || 0 },
          { key: 'error', label: '错误', count: levelCounts.error || 0 },
          { key: 'debug', label: '调试', count: levelCounts.debug || 0 },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-2 py-0.5 rounded text-xs transition-colors',
              filter === f.key
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn(
                'ml-1 px-1 rounded-full text-[10px]',
                f.key === 'error' && 'bg-red-500/10 text-red-600',
                f.key === 'warn' && 'bg-yellow-500/10 text-yellow-600',
                f.key === 'info' && 'bg-blue-500/10 text-blue-600',
                f.key === 'debug' && 'bg-muted text-muted-foreground',
                f.key === 'all' && 'bg-accent text-accent-foreground'
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <input
            type="checkbox"
            id="autoscroll"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            className="h-3 w-3"
          />
          <label htmlFor="autoscroll" className="text-xs text-muted-foreground cursor-pointer">
            自动滚动
          </label>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">
              {loading ? '加载中...' : filter === 'all' ? '暂无日志' : `无${filter}级别日志`}
            </p>
          </div>
        ) : (
          <div className="font-mono text-xs">
            {filteredLogs.map(entry => {
              const config = LEVEL_CONFIG[entry.level] || LEVEL_CONFIG.info
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-2 px-4 py-0.5 hover:bg-accent/30 transition-colors',
                    config.bg
                  )}
                >
                  {/* Timestamp */}
                  <span className="text-muted-foreground/70 flex-shrink-0 w-20 text-right">
                    {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  {/* Level badge */}
                  <span className={cn('flex-shrink-0 w-10 font-medium', config.color)}>
                    {config.label}
                  </span>

                  {/* Source */}
                  <span className="flex-shrink-0 w-16 text-muted-foreground/80 truncate">
                    [{entry.source}]
                  </span>

                  {/* Message */}
                  <span className={cn(
                    'flex-1 min-w-0 break-words',
                    entry.level === 'error' && 'text-red-600 dark:text-red-400',
                    entry.level === 'warn' && 'text-yellow-600 dark:text-yellow-400',
                  )}>
                    {entry.message}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
