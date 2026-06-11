import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  XCircle,
  X,
  Plus,
  MessageSquare,
  FileBox,
  Info,
  Send,
  Bot,
  User,
  Cog,
  Clock,
  ChevronRight,
  File,
  Download,
  Eye,
  GitBranch,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTasks } from '@/hooks/useTask'
import { useSessions, useMessages } from '@/hooks/useSession'
import { useWorkspaces } from '@/hooks/useWorkspace'
import { useArtifacts, getFileIcon, formatFileSize } from '@/hooks/useArtifact'
import { STATUS_CONFIG } from '@/components/workspace/TaskItem'
import { type ChatMessage, type ChatSession, type Task } from '@/types/workspace'
import { FileChangesTab } from '@/components/workspace/FileChangesTab'
import { LogsTab } from '@/components/workspace/LogsTab'

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: 'text-red-500 bg-red-500/10' },
  high: { label: '高', color: 'text-orange-500 bg-orange-500/10' },
  normal: { label: '普通', color: 'text-blue-500 bg-blue-500/10' },
  low: { label: '低', color: 'text-muted-foreground bg-muted' },
}

type Tab = 'sessions' | 'files' | 'artifacts' | 'logs' | 'details'

// ----------------------------------------------------------------
// Message bubble
// ----------------------------------------------------------------
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const senderIcon = {
    user: <User className="h-3.5 w-3.5 text-blue-500" />,
    ai: <Bot className="h-3.5 w-3.5 text-green-500" />,
    system: <Cog className="h-3.5 w-3.5 text-muted-foreground" />,
  }

  const senderLabel = { user: '我', ai: 'AI', system: '系统' }

  return (
    <div className="flex gap-3 px-4 py-2 hover:bg-accent/30 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
        {senderIcon[msg.sender]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-foreground">
            {senderLabel[msg.sender]}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.source && (
            <span className="text-xs text-muted-foreground">via {msg.source}</span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
        </div>

        {/* Code blocks */}
        {msg.codeBlocks.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.codeBlocks.map((block, i) => (
              <pre key={i} className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
                <code className={block.language ? `language-${block.language}` : ''}>
                  {block.code}
                </code>
              </pre>
            ))}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs bg-accent rounded px-2 py-1">
                <FileBox className="h-3.5 w-3.5" />
                <span className="truncate max-w-[120px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Session tab
// ----------------------------------------------------------------
function SessionTab({
  taskId,
  sessions,
  activeSessionId,
  setActiveSessionId,
}: {
  taskId: string
  sessions: ChatSession[]
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
}) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [addingSession, setAddingSession] = useState(false)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const { messages, send, streamingContent, isStreaming } = useMessages(
    activeSessionId,
    activeSessionId
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const { create: createSession } = useSessions(taskId)

  // Auto-select first session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, activeSessionId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await send(input.trim())
      setInput('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddSession = async () => {
    setAddingSession(true)
    try {
      const s = await createSession()
      setActiveSessionId(s.id)
    } finally {
      setAddingSession(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Session tabs bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-sidebar flex-shrink-0 overflow-x-auto">
        {sessions.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors',
              s.id === activeSessionId
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <MessageSquare className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{s.title}</span>
            {s.messageCount > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">
                {s.messageCount}
              </Badge>
            )}
          </button>
        ))}

        <button
          onClick={handleAddSession}
          disabled={addingSession}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors disabled:opacity-50"
          title="新建会话"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeSession ? (
          <>
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="py-2">
                {messages.length === 0 && !streamingContent ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">还没有消息</p>
                    <p className="text-xs mt-1">发送消息开始对话</p>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {/* AI 流式回复预览 */}
                    {streamingContent && (
                      <div className="flex gap-3 px-4 py-2">
                        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">AI</span>
                            <span className="text-xs text-muted-foreground">思考中</span>
                            <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse rounded-sm" />
                          </div>
                          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                            {streamingContent}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 等待 AI 首 token */}
                    {isStreaming && !streamingContent && (
                      <div className="flex gap-3 px-4 py-2">
                        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">AI</span>
                            <span className="text-xs text-muted-foreground">思考中</span>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Input bar */}
            <div className="flex-shrink-0 border-t p-3 bg-sidebar">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                  rows={2}
                  className="flex-1 resize-none text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex-shrink-0 h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">暂无会话</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleAddSession}
              disabled={addingSession}
            >
              <Plus className="h-4 w-4 mr-1" />
              新建会话
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Artifacts tab
// ----------------------------------------------------------------
function ArtifactsTab({ taskId, workspacePath }: { taskId: string; workspacePath?: string }) {
  const { artifacts, loading, error, refetch } = useArtifacts(taskId)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const api = (window as any).api

  const handleScanChanges = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const result = await api.gitScanChanges(taskId)
      if (result?.error) {
        setScanResult(`错误: ${result.error}`)
      } else {
        setScanResult(`成功扫描 ${result?.count ?? 0} 个变更文件`)
        refetch()
      }
    } catch (err: any) {
      setScanResult(`错误: ${err.message ?? '扫描失败'}`)
    } finally {
      setScanning(false)
    }
  }

  const handlePreview = (artifact: any) => {
    if (!artifact.path) return
    // 使用 Electron 的 shell 模块打开文件
    if ((window as any).api?.openFile) {
      (window as any).api.openFile(artifact.path)
    } else {
      // 降级方案：在新窗口中显示文件内容
      alert(`预览功能即将推出\n文件路径: ${artifact.path}`)
    }
  }

  const handleDownload = (artifact: any) => {
    if (!artifact.path) return
    // 使用 Electron 的 dialog 模块保存文件
    if ((window as any).api?.saveFile) {
      (window as any).api.saveFile(artifact.path)
    } else {
      // 降级方案：提示用户
      alert(`下载功能即将推出\n文件路径: ${artifact.path}`)
    }
  }

  const getChangeTypeBadge = (type?: string) => {
    if (!type) return null
    const config = {
      added: { label: '新增', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
      modified: { label: '修改', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      deleted: { label: '删除', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
    }
    const c = config[type as keyof typeof config]
    if (!c) return null
    return (
      <Badge variant="outline" className={cn('text-xs', c.class)}>
        {c.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <XCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">制品列表</h3>
          {artifacts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {artifacts.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scanResult && (
            <span className={cn(
              'text-xs',
              scanResult.includes('错误') ? 'text-destructive' : 'text-green-600'
            )}>
              {scanResult}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanChanges}
            disabled={scanning || !workspacePath}
            className="gap-1.5"
          >
            <GitBranch className={cn('h-4 w-4', scanning && 'animate-spin')} />
            {scanning ? '扫描中...' : '扫描变更'}
          </Button>
        </div>
      </div>

      {/* Artifacts list */}
      <ScrollArea className="flex-1">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <FileBox className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">暂无制品</p>
            <p className="text-xs mt-1">点击"扫描变更"检测文件变更</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {artifacts.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
              >
                {/* File icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center text-lg">
                  {a.type === 'screenshot' ? '🖼️' :
                   a.type === 'code' ? '📄' :
                   a.type === 'report' ? '📊' :
                   getFileIcon(a.name)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    {getChangeTypeBadge(a.gitChangeType)}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(a.size)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString('zh-CN')}
                    </span>
                    {a.isNew && (
                      <Badge variant="secondary" className="text-xs">新文件</Badge>
                    )}
                  </div>
                  {a.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{a.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.path && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(a)}
                        title="预览"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(a)}
                        title="下载"
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ----------------------------------------------------------------
// Details tab
// ----------------------------------------------------------------
function DetailsTab({ task, workspaceName }: { task: Task; workspaceName?: string }) {
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('zh-CN') : '—'

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    const s = Math.round(ms / 1000)
    if (s < 60) return `${s}秒`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}分${s % 60}秒`
    const h = Math.floor(m / 60)
    return `${h}时${m % 60}分`
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: '任务标题', value: task.title },
    { label: '工作空间', value: workspaceName ?? task.workspaceId },
    { label: '状态', value: <span className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', `bg-${STATUS_CONFIG[task.status]?.color}-500`)} />
      {STATUS_CONFIG[task.status]?.label ?? task.status}
    </span> },
    { label: '优先级', value: <span className={cn('text-xs px-1.5 py-0.5 rounded', PRIORITY_LABEL[task.priority]?.color)}>
      {PRIORITY_LABEL[task.priority]?.label ?? task.priority}
    </span> },
    { label: '创建时间', value: formatDate(task.createdAt) },
    { label: '开始时间', value: formatDate(task.startedAt) },
    { label: '结束时间', value: formatDate(task.finishedAt) },
    { label: '耗时', value: formatDuration(task.durationMs) },
    { label: '会话数', value: task.chatSessionIds.length },
    ...(task.description ? [{ label: '描述', value: task.description }] : []),
    ...(task.notes ? [{ label: '备注', value: task.notes }] : []),
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex gap-4">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-0.5">{row.label}</span>
            <span className="text-sm text-foreground flex-1">{row.value}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// ----------------------------------------------------------------
// TaskDetailPage
// ----------------------------------------------------------------
export function TaskDetailPage() {
  const { taskId, tab } = useParams<{ taskId: string; tab?: string }>()
  const navigate = useNavigate()
  const { tasks, start, complete, fail, cancel } = useTasks()
  const { workspaces } = useWorkspaces()
  const { sessions } = useSessions(taskId ?? null)
  const [activeTab, setActiveTab] = useState<Tab>('sessions')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync activeTab with URL param
  useEffect(() => {
    if (tab && ['sessions', 'files', 'artifacts', 'logs', 'details'].includes(tab)) {
      setActiveTab(tab as Tab)
    }
  }, [tab])

  // Auto-select first session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, activeSessionId])

  const task = tasks.find(t => t.id === taskId)
  const workspace = workspaces.find(w => w.id === task?.workspaceId)

  // Load task if not in local state
  useEffect(() => {
    if (!task && taskId) {
      // Try to fetch from API
      ;(window as any).api.taskGet(taskId).then(() => {
        // Task loaded via useTasks refetch
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [task, taskId])

  const handleStart = async () => {
    if (!taskId) return
    await start(taskId)
  }

  const handleComplete = async () => {
    if (!taskId) return
    await complete(taskId)
  }

  const handleFail = async () => {
    if (!taskId) return
    const notes = prompt('请输入失败原因（可选）：') ?? ''
    await fail(taskId, notes)
  }

  const handleCancel = async () => {
    if (!taskId) return
    await cancel(taskId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Clock className="h-5 w-5 animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <XCircle className="h-10 w-10 opacity-30" />
        <p className="text-lg font-medium">任务不存在</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[task.status]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-sidebar">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig.variant as any} color={statusConfig.color} className="gap-1 text-xs flex-shrink-0">
                {statusConfig.label}
              </Badge>
            </div>
            {workspace && (
              <div className="flex items-center gap-1 mt-0.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{workspace.name}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {task.status === 'pending' && (
              <Button size="sm" variant="default" className="gap-1.5" onClick={handleStart}>
                <PlayCircle className="h-4 w-4" />
                开始
              </Button>
            )}
            {task.status === 'running' && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5 text-green-600" onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4" />
                  完成
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-red-600" onClick={handleFail}>
                  <XCircle className="h-4 w-4" />
                  失败
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  取消
                </Button>
              </>
            )}
            {(task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') && (
              <span className="text-xs text-muted-foreground px-2">
                已结束 · {task.finishedAt && new Date(task.finishedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4">
          {([
            { key: 'sessions', label: '对话', icon: MessageSquare },
            { key: 'files', label: '文件变更', icon: File },
            { key: 'artifacts', label: '制品', icon: FileBox },
            { key: 'logs', label: '日志', icon: Info },
            { key: 'details', label: '详情', icon: Info },
          ] as { key: Tab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                navigate(`/tasks/${task.id}/${tab.key}`)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-500 text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'sessions' && (
          <SessionTab
            taskId={task.id}
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
          />
        )}
        {activeTab === 'files' && (
          <FileChangesTab taskId={task.id} workspacePath={workspace?.rootPath} />
        )}
        {activeTab === 'artifacts' && (
          <ArtifactsTab taskId={task.id} workspacePath={workspace?.rootPath} />
        )}
        {activeTab === 'logs' && (
          <LogsTab task={task} />
        )}
        {activeTab === 'details' && (
          <DetailsTab task={task} workspaceName={workspace?.name} />
        )}
      </div>
    </div>
  )
}
